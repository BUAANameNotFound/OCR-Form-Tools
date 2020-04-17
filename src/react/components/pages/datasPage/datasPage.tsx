import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, IconButton} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./datasPage.scss";
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
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = strings.datas.title + " - " + strings.appName;
    }

    private quantityInput: React.RefObject<HTMLInputElement> = React.createRef();

    public render() {

        const inputDisabled: boolean = this.state.isGenerating;
        const generateDisabled: boolean = !this.state.dataQuantityLoaded || this.state.isGenerating;
        const downloadDisabled: boolean = !this.state.dataGenerateLoaded || this.state.isGenerating;
        

        return (
            <div className="datas" id="pageDatas">
                <div className="datas-main">
                </div>
                <div className="datas-sidebar bg-lighter-1">
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
                this.setState({
                    dataQuantity: Number(quantityNumber),
                    dataQuantityLoaded: true,
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
        this.getDatasGenerate()
            .then((result) => {
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

    private handleDownloadClick = () => {

        const endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `/download/pdf`,
        );

        const headers = { "responseType" : "blob"};
        this.poll(() =>
        ServiceHelper.postWithAutoRetry(
                endpointURL, {}, { headers }, this.props.project.apiKey as string), 120000, 500)
        .then((res) => {
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

    }

    private async getDatasGenerate(): Promise<any> {

        const endpointURL = url.resolve(
            this.props.project.apiUriBase,
            `/generate/pdf`,
        );
        
        const headers = {"Content-Type": "json", "cache-control": "no-cache" };
        let jsonforsend = "";
        let response;
        try {
            response = await ServiceHelper.postWithAutoRetry(
                endpointURL, jsonforsend, { headers }, this.props.project.apiKey as string);
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }

        const operationLocation = response.headers["operation-location"];

        // Make the second REST API call and get the response.
        return this.poll(() =>
            ServiceHelper.getWithAutoRetry(
                operationLocation, { headers }, this.props.project.apiKey as string), 120000, 500);
        
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
        console.log("dddd3");
        const checkSucceeded = (resolve, reject) => {
            const ajax = func();
            ajax.then((response) => {
                if (response.data.status.toLowerCase() === constants.statusCodeSucceeded) {
                    resolve(response.data);
                } else if (response.data.status.toLowerCase() === constants.statusCodeFailed) {
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
}