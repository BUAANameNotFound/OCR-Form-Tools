// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, IconButton} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./uploadPage.scss";
import {
    IApplicationState, IConnection, IProject, IAppSettings, AppError, ErrorCode,
} from "../../../../models/applicationState";
import { ImageMap } from "../../common/imageMap/imageMap";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import _ from "lodash";
import pdfjsLib from "pdfjs-dist";
import Alert from "../../common/alert/alert";
import url from "url";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { Feature } from "ol";
import Polygon from "ol/geom/Polygon";
import { strings, interpolate } from "../../../../common/strings";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import ServiceHelper from "../../../../services/serviceHelper";
import { parseTiffData, renderTiffToCanvas, loadImageToCanvas } from "../../../../common/utils";
import { constants } from "../../../../common/constants";
import { getPrimaryGreenTheme, getPrimaryWhiteTheme } from "../../../../common/themes";
import { SkipButton } from "../../shell/skipButton";
import axios from "axios";

const cMapUrl = constants.pdfjsCMapUrl(pdfjsLib.version);

export interface IUploadPageProps extends RouteComponentProps, React.Props<UploadPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IUploadPageState {
    fileLabel: string;
    projectLoaded: boolean;
    currPage: number;
    imageUri: string;
    imageWidth: number;
    imageHeight: number;
    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    fileChanged: boolean;
    uploadRun: boolean;
    isUploading: boolean;
    file?: File;
    highlightedField: string;
    backendBaseURL: string;
    uploadSucceeded: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
        appSettings: state.appSettings,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
        appTitleActions: bindActionCreators(appTitleActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class UploadPage extends React.Component<IUploadPageProps, IUploadPageState> {
    public state: IUploadPageState = {
        fileLabel: "Browse for a file...",
        projectLoaded: true,
        currPage: undefined,
        imageUri: null,
        imageWidth: 0,
        imageHeight: 0,
        shouldShowAlert: false,
        alertTitle: "",
        alertMessage: "",
        fileChanged: false,
        uploadRun: false,
        isUploading: false,
        highlightedField: "",
        backendBaseURL: "https://lyniupi.azurewebsites.net/",
        uploadSucceeded: false,
    };

    private fileInput: React.RefObject<HTMLInputElement> = React.createRef();
    private currPdf: any;
    private tiffImages: any[];
    private imageMap: ImageMap;

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = "upload" + " - " + strings.appName;
    }

    public componentDidUpdate(prevProps, prevState) {
        if (this.state.file) {
            if (this.state.fileChanged) {
                this.currPdf = null;
                this.tiffImages = [];
                this.loadFile(this.state.file);
                this.setState({ fileChanged: false });
            } else if (prevState.currPage !== this.state.currPage) {
                if (this.currPdf !== null) {
                    this.loadPdfPage(this.currPdf, this.state.currPage);
                } else if (this.tiffImages.length !== 0) {
                    this.loadTiffPage(this.tiffImages, this.state.currPage);
                }
            }
        }
    }

    public render() {
        const browseFileDisabled: boolean = !this.state.projectLoaded;
        const uploadDisabled: boolean = !this.state.projectLoaded || !this.state.file;

        return (
            <div className="upload" id="pageUpload">
                <div className="upload-main">
                    {this.state.file && this.state.imageUri && this.renderImageMap()}
                    {this.renderPrevPageButton()}
                    {this.renderNextPageButton()}
                </div>
                <div className="upload-sidebar bg-lighter-1">
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="Insights" />
                            <span className="condensed-list-title">Upload</span>
                        </h6>
                        <div className="p-3">
                            <h5>
                                Upload template
                            </h5>
                            <div style={{display: "flex", marginBottom: "25px"}}>
                                <input
                                    aria-hidden="true"
                                    type="file"
                                    accept="application/pdf, image/jpeg, image/png, image/tiff"
                                    id="hiddenInputFile"
                                    ref={this.fileInput}
                                    onChange={this.handleFileChange}
                                    disabled={browseFileDisabled} />
                                <input
                                    type="text"
                                    id="inputTempFile"
                                    style = {{cursor: (browseFileDisabled ? "default" : "pointer")}}
                                    onClick={this.handleDummyInputClick}
                                    readOnly={true}
                                    className="dummyInputFile"
                                    aria-label="Upload file"
                                    value={this.state.fileLabel}/>
                                <div className="rlMargin10">
                                    <PrimaryButton
                                        theme={getPrimaryGreenTheme()}
                                        text="Browse"
                                        allowDisabledFocus
                                        disabled={browseFileDisabled}
                                        autoFocus={true}
                                        onClick={this.handleDummyInputClick}
                                    />
                                </div>
                                <PrimaryButton
                                    theme={getPrimaryWhiteTheme()}
                                    text="Upload"
                                    aria-label={!this.state.projectLoaded ? "inproessing" : ""}
                                    allowDisabledFocus
                                    disabled={uploadDisabled}
                                    onClick={this.handleClick}
                                />
                            </div>
                            {!this.state.projectLoaded &&
                                <div className="loading-container">
                                    <Spinner
                                        label="Uploading"
                                        ariaLive="assertive"
                                        labelPosition="right"
                                        size={SpinnerSize.large}
                                    />
                                </div>
                            }
                            {this.state.uploadSucceeded &&
                                <div>
                                    blank template has been successfully uploaded.
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <Alert
                    show={this.state.shouldShowAlert}
                    title={this.state.alertTitle}
                    message={this.state.alertMessage}
                    onClose={() => this.setState({
                        shouldShowAlert: false,
                        alertTitle: "",
                        alertMessage: "",
                        projectLoaded: true,
                    })}
                />
                <PreventLeaving
                    when={this.state.isUploading}
                    message={"A Upload operation is currently in progress, are you sure you want to leave?"}
                />
                <SkipButton skipTo="pageUpload">{strings.common.skipToMainContent}</SkipButton>
            </div>
        );
    }

    private handleDummyInputClick = () => {
        document.getElementById("hiddenInputFile").click();
    }

    private renderPrevPageButton = () => {
        if (!_.get(this, "fileInput.current.files[0]", null)) {
            return <div></div>;
        }
        const prevPage = () => {
            this.setState((prevState) => ({
                currPage: Math.max(1, prevState.currPage - 1),
            }));
        };

        if (this.state.currPage > 1) {
            return (
                <IconButton
                    className="toolbar-btn prev"
                    title="Previous"
                    iconProps={{iconName: "ChevronLeft"}}
                    onClick={prevPage}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private renderNextPageButton = () => {
        if (!_.get(this, "fileInput.current.files[0]", null)) {
            return <div></div>;
        }

        const numPages = this.getPageCount();
        const nextPage = () => {
            this.setState((prevState) => ({
                currPage: Math.min(prevState.currPage + 1, numPages),
            }));
        };

        if (this.state.currPage < numPages) {
            return (
                <IconButton
                    className="toolbar-btn next"
                    title="Next"
                    onClick={nextPage}
                    iconProps={{iconName: "ChevronRight"}}
                />
            );
        } else {
            return <div></div>;
        }
    }

    private renderImageMap = () => {
        return (
            <ImageMap
                ref={(ref) => this.imageMap = ref}
                imageUri={this.state.imageUri || ""}
                imageWidth={this.state.imageWidth}
                imageHeight={this.state.imageHeight}

                featureStyler={this.featureStyler}
                onMapReady={this.noOp}
            />
        );
    }

    private handleFileChange = () => {
        if (this.fileInput.current.value !== "") {
            const fileName = this.fileInput.current.value.split("\\").pop();
            if (fileName !== "") {
                this.setState({
                    fileLabel: fileName,
                    currPage: 1,
                    fileChanged: true,
                    file: this.fileInput.current.files[0],
                    uploadRun: false,
                    uploadSucceeded: false,
                }, () => {
                    if (this.imageMap) {
                        this.imageMap.removeAllFeatures();
                    }
                });
            }
        }
    }

    private handleClick = () => {
        this.setState({ projectLoaded: false, isUploading: true, uploadSucceeded: false });
        const endpointURL = url.resolve(
            this.state.backendBaseURL,
            `/api/UpLoadPdf?path=${this.props.project.folderPath}`,
        );
        console.log(endpointURL);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': this.state.file.type },
            body: this.state.file,
        };
        //console.log(endpointURL);
        try {
            this.poll(() =>
                fetch(endpointURL, requestOptions), 120000, 500)
                .then((result) => {
                    console.log(result);
                    this.setState({
                        projectLoaded: true,
                        uploadRun: true,
                        isUploading: false,
                        uploadSucceeded: true,
                    });
            }).catch((error) => {
                let alertMessage = "";
                if (error.response) {
                    alertMessage = error.response.data;
                } else {
                    alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
                }
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Upload Failed",
                    alertMessage,
                    isUploading: false,
                    uploadSucceeded: false,
                });
            });
        } 
        catch (err) {
            ServiceHelper.handleServiceError(err);
        }
        
    }

    private getPageCount() {
        if (this.currPdf !== null) {
            return _.get(this.currPdf, "numPages", 1);
        } else if (this.tiffImages.length !== 0) {
            return this.tiffImages.length;
        }

        return 1;
    }

    private loadFile = (file: File) => {
        if (!file) {
            // no file
            return;
        }

        // determine how to load file based on MIME type of the file
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
        switch (file.type) {
            case "image/jpeg":
            case "image/png":
                this.loadImageFile(file);
                break;

            case "image/tiff":
                this.loadTiffFile(file);
                break;

            case "application/pdf":
                this.loadPdfFile(file);
                break;

            default:
                // un-supported file type
                this.setState({
                    imageUri: "",
                    shouldShowAlert: true,
                    alertTitle: "Not supported file type",
                    alertMessage: "Sorry, we currently only support JPG/PNG/PDF files.",
                });
                break;
        }
    }

    private loadImageFile = async (file: File) => {
        const imageUri = this.createObjectURL(file);
        const canvas = await loadImageToCanvas(imageUri);
        this.setState({
            currPage: 1,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
        });
    }

    private loadTiffFile = async (file) => {
        const fileArrayBuffer = await HtmlFileReader.readFileAsArrayBuffer(file);
        this.tiffImages = parseTiffData(fileArrayBuffer);
        this.loadTiffPage(this.tiffImages, this.state.currPage);
    }

    private loadTiffPage = (tiffImages: any[], pageNumber: number) => {
        const tiffImage = tiffImages[pageNumber - 1];
        const canvas = renderTiffToCanvas(tiffImage);
        this.setState({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: tiffImage.width,
            imageHeight: tiffImage.height,
        });
    }

    private loadPdfFile = (file) => {
        const fileReader: FileReader = new FileReader();

        fileReader.onload = (e: any) => {
            const typedArray = new Uint8Array(e.target.result);
            const loadingTask = pdfjsLib.getDocument({data: typedArray, cMapUrl, cMapPacked: true});
            loadingTask.promise.then((pdf) => {
                this.currPdf = pdf;
                this.loadPdfPage(pdf, this.state.currPage);
            }, (reason) => {
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Failed loading PDF",
                    alertMessage: reason.toString(),
                });
            });
        };

        fileReader.readAsArrayBuffer(file);
    }

    private loadPdfPage = async (pdf, pageNumber) => {
        const page = await pdf.getPage(pageNumber);
        const defaultScale = 2;
        const viewport = page.getViewport({ scale: defaultScale });

        // Prepare canvas using PDF page dimensions
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport,
        };

        const renderTask = page.render(renderContext);
        await renderTask.promise;
        this.setState({
            currPage: pageNumber,
            imageUri: canvas.toDataURL(constants.convertedImageFormat, constants.convertedImageQuality),
            imageWidth: canvas.width,
            imageHeight: canvas.height,
        });
    }

    private featureStyler = (feature) => {
        return new Style({
            stroke: new Stroke({
                color: feature.get("color"),
                width: feature.get("isHighlighted") ? 4 : 2,
            }),
            fill: new Fill({
                color: "rgba(255, 255, 255, 0)",
            }),
        });
    }


    /**
     * Poll function to repeatly check if request succeeded
     * @param func - function that will be called repeatly
     * @param timeout - timeout
     * @param interval - interval
     */
    private poll = (func, timeout, interval): Promise<any> => {
        const endTime = Number(new Date()) + (timeout || 10000);
        interval = interval || 100;

        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                //console.log(response);
                if (response.status === 200) {
                    resolve(response);
                } else if (response.status != 200) {
                    reject("Error");
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject("Timed out, please try other quantity.");
                }
            }).catch((error) => {
                reject("Error");
            });
        };

        return new Promise(checkSucceeded);
    }

    private createObjectURL = (object: File) => {
        // generate a URL for the object
        return (window.URL) ? window.URL.createObjectURL(object) : "";
    }

    private noOp = () => {
        // no operation
    }
}
