import React, { RefObject }  from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, IconButton} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./datasPage.scss";
import {
    AppError, ErrorCode, 
    AssetState, AssetType, EditorMode, IApplicationState,IConnection,
    IAppSettings, IAsset, IAssetMetadata, IProject,
    ISize,ILabel,
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
import ServiceHelper from "../../../../services/serviceHelper";
import { constants } from "../../../../common/constants";
import { getPrimaryGreenTheme, getPrimaryWhiteTheme } from "../../../../common/themes";
import { SkipButton } from "../../shell/skipButton";
import SplitPane from "react-split-pane";
import DatasSideBar from "./datasSideBar"
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import axios from "axios";

import Canvas from "./canvas";
import CanvasHelpers from "./canvasHelpers";

export interface IDatasPageProps extends RouteComponentProps, React.Props<DatasPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IDatasPageState {

    assets: IAsset[];
    selectedAsset?: IAssetMetadata;
    NumberLabel: string;
    tagLoaded: boolean;
    dataQuantity: number; 
    lastDataQuantity: number;
    dataQuantityLoaded: boolean;
    dataGenerateLoaded: boolean;
    isGenerating: boolean;
    shouldShowAlert: boolean;
    alertTitle: string;
    alertMessage: string;
    thumbnailSize: ISize;
    isValid: boolean;
    editorMode: EditorMode;
    lockedTags: string[];
    hoveredLabel: ILabel;
    backendBaseURL: string;
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
export default class DatasPage extends React.Component<IDatasPageProps, IDatasPageState> {
    public state: IDatasPageState = {
        assets: [],
        NumberLabel: "Input a integer...",
        tagLoaded: true,
        dataQuantity: 0,
        lastDataQuantity: 0,
        dataQuantityLoaded: false,
        dataGenerateLoaded: false,
        isGenerating: false,
        shouldShowAlert: false,
        alertTitle: "",
        alertMessage: "",
        thumbnailSize: { width: 175, height: 155 },
        isValid: true,
        editorMode: EditorMode.Select,
        lockedTags: [],
        hoveredLabel: null,
        backendBaseURL: "https://lyniupi.azurewebsites.net/",
    };


    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private isUnmount: boolean = false;
    
    constructor(props) {
        super(props);
    }

    public async componentDidMount() {

        window.addEventListener("focus", this.onFocused);
        this.isUnmount = false;
        const projectId = this.props.match.params["projectId"];
        if (this.props.project) {
            await this.loadProjectAssets();
            this.props.appTitleActions.setTitle(this.props.project.name);
        } 
        else if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = strings.datas.title + " - " + strings.appName;
    }

    public async componentDidUpdate(prevProps: Readonly<IDatasPageProps>) {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }

        if (this.props.project && prevProps.project && this.props.project.tags !== prevProps.project.tags) {
            this.updateRootAssets();
        }
    }

    public componentWillUnmount() {
        this.isUnmount = true;
        window.removeEventListener("focus", this.onFocused);
    }
    

    private quantityInput: React.RefObject<HTMLInputElement> = React.createRef();

    public render() {

        const inputDisabled: boolean = this.state.isGenerating;
        const generateDisabled: boolean = !this.state.dataQuantityLoaded || this.state.isGenerating;
        const downloadDisabled: boolean = !this.state.dataGenerateLoaded || this.state.isGenerating;
        
        const { project } = this.props;
        const { assets, selectedAsset} = this.state;
        const rootAssets = assets.filter((asset) => !asset.parent);
       

        if (!project) {
           return (<div>Loading...</div>);
        }
        return (
            <div className="datas" id="pageDatas">
                <SplitPane split="vertical"
                    defaultSize={this.state.thumbnailSize.width}
                    minSize={175}
                    maxSize={175}
                    paneStyle={{ display: "flex" }}
                    onChange={this.onSideBarResize}
                    onDragFinished={this.onSideBarResizeComplete}>
                    <div className="datas-sidebar bg-lighter-1">
                    {this.state.dataGenerateLoaded &&
                        <DatasSideBar
                            assets={rootAssets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    }
                    </div>
                    <div className="datas-content">
                        <div className="datas-content-main" >
                            <div className="datas-content-main-body">
                                {this.state.dataGenerateLoaded && selectedAsset &&
                                    <Canvas
                                        ref={this.canvas}
                                        selectedAsset={this.state.selectedAsset}
                                        onAssetMetadataChanged={this.onAssetMetadataChanged}                                        
                                        editorMode={this.state.editorMode}
                                        project={this.props.project}
                                        lockedTags={this.state.lockedTags}
                                        hoveredLabel={this.state.hoveredLabel}>
                                        <AssetPreview
                                            controlsEnabled={this.state.isValid}
                                            onBeforeAssetChanged={this.onBeforeAssetSelected}
                                            asset={this.state.selectedAsset.asset} />
                                    </Canvas>
                                }
                            </div>
                        </div>

                        <div className="datas-right-sidebar bg-lighter-1">
                            <div className="condensed-list">
                                <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                                    <FontIcon className="mr-1" iconName="Insights" />
                                    <span className="condensed-list-title">GenerateDatas</span>
                                </h6>
                                <div className="p-3">
                                    <h5>
                                        {strings.datas.inputNumber}
                                    </h5>
                                    <div style={{display: "flex", marginBottom: "25px"}}>
                                        <input
                                            type="text"
                                            id="inputNumber"
                                            style = {{cursor: (generateDisabled ? "default" : "pointer")}}
                                            ref={this.quantityInput}
                                            placeholder={this.state.NumberLabel}
                                            onChange={this.handleQuantityChange}
                                            disabled={inputDisabled}
                                            />
                                        <div className="rlMargin10">
                                            <PrimaryButton
                                                theme={getPrimaryGreenTheme()}
                                                text="Generate"
                                                allowDisabledFocus
                                                disabled={generateDisabled}
                                                autoFocus={true}
                                                onClick={this.handleGenerateClick}
                                            />
                                        </div>
                                        <PrimaryButton
                                            theme={getPrimaryWhiteTheme()}
                                            text="Download"
                                            aria-label={!this.state.dataGenerateLoaded ? strings.datas.inProgress : ""}
                                            allowDisabledFocus
                                            disabled={downloadDisabled}
                                            onClick={this.handleDownloadClick}
                                        />
                                    </div>
                                    {this.state.isGenerating &&
                                    <div className="loading-container">
                                        <Spinner
                                            label={strings.datas.inProgress}
                                            ariaLive="assertive"
                                            labelPosition="right"
                                            size={SpinnerSize.large}
                                        />
                                    </div>
                                    }
                                    {this.state.dataGenerateLoaded &&
                                    <div>
                                        {this.state.lastDataQuantity} Datas has been successfully generated.
                                    </div>
                                    }
                                </div>
                            </div>
                        </div>

                    </div>
                </SplitPane>
              
                <Alert
                    show={this.state.shouldShowAlert}
                    title={this.state.alertTitle}
                    message={this.state.alertMessage}
                    onClose={() => this.setState({
                        shouldShowAlert: false,
                        alertTitle: "",
                        alertMessage: "",
                        dataGenerateLoaded: false,
                    })}
                />
            </div>
        );
    }

    private handleQuantityChange = () => {
        if (this.quantityInput.current.value !== "") {
            const quantityNumber = this.quantityInput.current.value;
            if (quantityNumber !== "") {
                if (this.isInteger(quantityNumber)) {
                    this.setState({
                        dataQuantity: Number(quantityNumber),
                        dataQuantityLoaded: true,
                    });
                } else {
                    this.setState({
                        dataQuantity: 0,
                        dataQuantityLoaded: false,
                    }); 
                }
            } else {
                this.setState({
                    dataQuantity: 0,
                    dataQuantityLoaded: false,
                });               
            }
        } else {
            this.setState({
                dataQuantity: 0,
                dataQuantityLoaded: false,
            });
        }
    }

    private handleGenerateClick = () => {
        this.setState({dataGenerateLoaded: false, isGenerating: true,});

        const endpointURL = url.resolve(
            this.state.backendBaseURL,
            `/api/HttpTryLy1?genNum=${this.state.dataQuantity}`,
        );
        const requestOptions = {
            method: 'GET',
        };
        //console.log(endpointURL);
        try {
            this.poll(() =>
                fetch(endpointURL, requestOptions), 120000, 500)
                .then((result) => {
                    //console.log(this.props.project.sourceConnection.providerOptions["sas"]);
                    let lastQuantity = this.state.dataQuantity;
                    this.setState({
                        isGenerating: false,
                        dataGenerateLoaded: true,
                        lastDataQuantity : lastQuantity,
                    });
                }).catch((error) => {
                    let alertMessage = "";
                    if (error.response) {
                        alertMessage = error.response.data;
                    } else if (error.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
                        alertMessage = strings.errors.predictWithoutTrainForbidden.message;
                    } else if (error.errorCode === ErrorCode.ModelNotFound) {
                        alertMessage = error.message;
                    } else {
                        alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
                    }
                    /*
                    let lastQuantity = this.state.dataQuantity;
                    this.setState({
                        isGenerating: false,
                        dataGenerateLoaded: true,
                        lastDataQuantity : lastQuantity,
                    });
                    */
                      
                    this.setState({
                        shouldShowAlert: true,
                        alertTitle: "Generate Error",
                        alertMessage,
                        isGenerating: false,
                        dataGenerateLoaded: false,
                    });
                    
                });
        } 
        catch (err) {
            ServiceHelper.handleServiceError(err);
        }
    
    }

    private handleDownloadClick = () => {

        const endpointURL = url.resolve(
            this.state.backendBaseURL,
            `/api/HttpTryLy1`,
        );

        const requestOptions = {
            method: 'GET',
            headers: { "responseType" : "blob"},
        };
        try {
            this.poll(() =>
            fetch(endpointURL, requestOptions), 120000, 500)
            .then((res) => {
                console.log(res);
                let url = window.URL.createObjectURL(new Blob([res.data]));
                let link= document.createElement('a');
                link.style.display='none';
                link.href=url;
                link.setAttribute('download', "datas.zip");
                document.body.appendChild(link);
                link.click();
            }).catch((error) => {
                let alertMessage = "";
                if (error.response) {
                    alertMessage = error.response.data;
                } else if (error.errorCode === ErrorCode.PredictWithoutTrainForbidden) {
                    alertMessage = strings.errors.predictWithoutTrainForbidden.message;
                } else if (error.errorCode === ErrorCode.ModelNotFound) {
                    alertMessage = error.message;
                } else {
                    alertMessage = interpolate(strings.errors.endpointConnectionError.message, { endpoint: "form recognizer backend URL" });
                }
                this.setState({
                    shouldShowAlert: true,
                    alertTitle: "Download Error",
                    alertMessage,
                });
            });
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        } 
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


        /**
     * Called when the asset side bar is resized
     * @param newWidth The new sidebar width
     */
    private onSideBarResize = (newWidth: number) => {
        this.setState({
            thumbnailSize: {
                width: newWidth,
                height: newWidth / (4 / 3),
            },
        });
    }

    /**
     * Called when the asset sidebar has been completed
     */
    private onSideBarResizeComplete = () => {
        const appSettings = {
            ...this.props.appSettings,
            thumbnailSize: this.state.thumbnailSize,
        };

        this.props.applicationActions.saveAppSettings(appSettings);
    }


    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets) {
            return;
        }

        this.loadingProjectAssets = true;

        const rootAssets: IAsset[] = _(await this.props.actions.loadAssets(this.props.project))
            .uniqBy((asset) => asset.id)
            .value();

        if (this.state.assets.length === rootAssets.length
            && this.state.assets.map((asset) => asset.id).join(",") === rootAssets.map((asset) => asset.id).join(",")) {
            this.loadingProjectAssets = false;
            return;
        }

        const lastVisited = rootAssets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

        this.setState({
            assets: rootAssets,
        }, async () => {
            if (rootAssets.length > 0) {
                await this.selectAsset(lastVisited ? lastVisited : rootAssets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }


    /**
     * Updates the root asset list from the project assets
     */
    private updateRootAssets = () => {
        const updatedAssets = [...this.state.assets];
        updatedAssets.forEach((asset) => {
            const projectAsset = _.get(this.props, "project.assets[asset.id]", null);
            if (projectAsset) {
                asset.state = projectAsset.state;
            }
        });

        this.setState({ assets: updatedAssets });
    }


    private onBeforeAssetSelected = (): boolean => {
        return this.state.isValid;
    }

    private selectAsset = async (asset: IAsset): Promise<void> => {
        // Nothing to do if we are already on the same asset.
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id === asset.id) {
            return;
        }

        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);

        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }

        this.setState({
            selectedAsset: assetMetadata,
        });
    }

    /**
     * Returns a value indicating whether the current asset is taggable
     */
    private isTaggableAssetType = (asset: IAsset): boolean => {
        return asset.type !== AssetType.Unknown;
    }

    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // Comment out below code as we allow regions without tags, it would make labeler's work easier.

        const initialState = assetMetadata.asset.state;

        // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
        // asset selected from the side bar (image/video).
        const rootAsset = { ...(assetMetadata.asset.parent || assetMetadata.asset) };

        if (this.isTaggableAssetType(assetMetadata.asset)) {
            assetMetadata.asset.state = AssetState.Visited;
        } else if (assetMetadata.asset.state === AssetState.NotVisited) {
            assetMetadata.asset.state = AssetState.Visited;
        }

        // Update root asset if not already in the "Tagged" state
        // This is primarily used in the case where a Video Frame is being edited.
        // We want to ensure that in this case the root video asset state is accurately
        // updated to match that state of the asset.
        if (rootAsset.id === assetMetadata.asset.id) {
            rootAsset.state = assetMetadata.asset.state;
        } else {
            const rootAssetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, rootAsset);

            if (rootAssetMetadata.asset.state !== AssetState.Tagged) {
                rootAssetMetadata.asset.state = assetMetadata.asset.state;
                await this.props.actions.saveAssetMetadata(this.props.project, rootAssetMetadata);
            }

            rootAsset.state = rootAssetMetadata.asset.state;
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
            if (this.props.project.lastVisitedAssetId === assetMetadata.asset.id) {
                this.setState({selectedAsset: assetMetadata});
            }
        }

        await this.props.actions.saveProject(this.props.project);

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((asset) => asset.id === rootAsset.id);
        if (assetIndex > -1) {
            assets[assetIndex] = {
                ...rootAsset,
            };
        }

        this.setState({ assets, isValid: true });

        // Workaround for if component is unmounted
        if (!this.isUnmount) {
            this.props.appTitleActions.setTitle(`${this.props.project.name} - [ ${rootAsset.name} ]`);
        }
    }

    private onFocused = () => {
        this.loadProjectAssets();
    }

    private isInteger = (quantity : string) => {
        let reg = /^[+]?0*[1-9][0-9]*$/;
        if(reg.test(quantity)){
            return true;//手机号码正确
        }
        return false;
    }
}