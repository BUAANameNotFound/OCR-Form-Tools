import React, { RefObject }  from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./datasPage.scss";
import {
    ErrorCode,
    IApplicationState,IConnection,IAppSettings, IAsset, IAssetMetadata, IProject,
    ISize,
} from "../../../../models/applicationState";
import _ from "lodash";
import Alert from "../../common/alert/alert";
import url from "url";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings, interpolate } from "../../../../common/strings";
import ServiceHelper from "../../../../services/serviceHelper";
import { getPrimaryGreenTheme, getPrimaryWhiteTheme } from "../../../../common/themes";
import SplitPane from "react-split-pane";
import DatasSideBar from "./datasSideBar"
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import Canvas from "./canvas";


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
    /** Array of assets in project */
    assets: IAsset[];
    /** The selected asset for the primary editing experience */
    selectedAsset?: IAssetMetadata;
    /** The string in input textarea */
    NumberLabel: string;
    /** The quantity of data inputed */
    dataQuantity: number;
    /** The quantity of data last time */
    lastDataQuantity: number;
    /** whether input the quantity of data with correct format*/
    dataQuantityLoaded: boolean;
    /** whether be generated successfully */
    dataGenerateLoaded: boolean;
    /** whether be generating */
    isGenerating: boolean;
    /** whether show alert window */
    shouldShowAlert: boolean;
    /** the title of alert window */
    alertTitle: string;
    /** the message in alert window */
    alertMessage: string;
    /** Size of the asset thumbnails to display in the side bar */
    thumbnailSize: ISize;
    isValid: boolean;
    /** the base url of our service */
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
        backendBaseURL: "https://lyniupi.azurewebsites.net/",
    };


    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private isUnmount: boolean = false;

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
                                        project={this.props.project}>
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
                                    <span className="condensed-list-title">GenerateData</span>
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
                                        {this.state.lastDataQuantity} Data has been successfully generated.
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

    /**
     * Handle input change event when change the quantity of data inputed
     */

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

    /**
     * Handle click event when click the generate button
     */

    private handleGenerateClick = () => {
        this.setState({dataGenerateLoaded: false, isGenerating: true,});

        const endpointURL = url.resolve(
            this.state.backendBaseURL,
            `/api/Generate?genNum=${this.state.dataQuantity}&path=${this.props.project.folderPath}`,
        );
        console.log(endpointURL);
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
                    this.loadProjectAssets()
                    .then(() => {
                        this.setState({
                            isGenerating: false,
                            dataGenerateLoaded: true,
                            lastDataQuantity : lastQuantity,
                        });
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

    /**
     * Handle click event when click the download button
     */

    private handleDownloadClick = () => {

        const endpointURL = url.resolve(
            this.state.backendBaseURL,
            `/api/DownLoad?path=${this.props.project.folderPath}`,
        );

        const requestOptions = {
            method: 'GET',
            headers: { "responseType" : "blob"},
        };
        try {
            this.poll(() =>
            fetch(endpointURL, requestOptions), 120000, 500)
            .then((res) => res.blob())
            .then((blob)=>{
                let a = document.createElement("a");
                const url = window.URL || window.webkitURL
                a.href = url.createObjectURL(blob)
                a.download = "data.zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            })
            .catch((error) => {
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
                } else if (response.status !== 200) {
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

        const rootAssets: IAsset[] = _(await this.props.actions.loadAssets(this.props.project, 3))
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

    private onFocused = () => {
        this.loadProjectAssets();
    }

    /**
     * Check whether the quantity of data inputed meets the requirements
     * @param quantity The quantity of data inputed
     */
    private isInteger = (quantity : string) => {
        let reg = /^[+]?0*(([1-4][0-9])|([1-9]))$/;
        if(reg.test(quantity)){
            return true;
        }
        return false;
    }
}
