// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {connect} from "react-redux";
import {RouteComponentProps} from "react-router-dom";
import {bindActionCreators} from "redux";
import {FontIcon, PrimaryButton, Spinner, SpinnerSize} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {AssetKind, IApplicationState, IAppSettings, IConnection, IProject} from "../../../../models/applicationState";
import TrainChart from "./trainChart";
import TrainPanel from "./trainPanel";
import TrainTable from "./trainTable";
import {ITrainRecordProps} from "./trainRecord";
import "./trainPage.scss";
import {interpolate, strings} from "../../../../common/strings";
import {constants} from "../../../../common/constants";
import _ from "lodash";
import Alert from "../../common/alert/alert";
import url from "url";
import PreventLeaving from "../../common/preventLeaving/preventLeaving";
import ServiceHelper from "../../../../services/serviceHelper";
import {getPrimaryGreenTheme} from "../../../../common/themes";
import {SkipButton} from "../../shell/skipButton";
import {delay, throttle} from "../../../../common/utils";
import {OCRService} from "../../../../services/ocrService";
import * as path from "path";
import {toast} from "react-toastify";

export interface ITrainPageProps extends RouteComponentProps, React.Props<TrainPage> {
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    recentProjects: IProject[];
    appTitleActions: IAppTitleActions;
}

export interface ITrainPageState {
    trainMessage: string;
    isTraining: boolean;
    currTrainRecord: ITrainRecordProps;
    viewType: "chartView" | "tableView";
    showTrainingFailedWarning: boolean;
    trainingFailedMessage: string;
}

interface ITrainApiResponse {
    modelId: string;
    createdDateTime: string;
    averageModelAccuracy: number;
    fields: object[];
}

function mapStateToProps(state: IApplicationState) {
    return {
        appSettings: state.appSettings,
        project: state.currentProject,
        connections: state.connections,
        recentProjects: state.recentProjects,
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
export default class TrainPage extends React.Component<ITrainPageProps, ITrainPageState> {

    constructor(props) {
        super(props);

        this.state = {
            trainMessage: strings.train.notTrainedYet,
            isTraining: false,
            currTrainRecord: null,
            viewType: "tableView",
            showTrainingFailedWarning: false,
            trainingFailedMessage: "",
        };
    }

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);

            this.props.appTitleActions.setTitle(project.name);
            this.updateCurrTrainRecord(this.getProjectTrainRecord());
            console.log(this.getProjectTrainRecord());
        }
        document.title = strings.train.title + " - " + strings.appName;
    }

    public render() {

        return (
            <div className="train-page" id="pageTrain">
                <main className="train-page-main">
                    {this.state.currTrainRecord &&
                        <div>
                            <h3> Train Result </h3>
                            <span> Model ID: {this.state.currTrainRecord.modelInfo.modelId} </span>
                        </div>
                    }
                    {this.state.viewType === "tableView" &&
                        <TrainTable
                            trainMessage={this.state.trainMessage}
                            accuracies={this.state.currTrainRecord && this.state.currTrainRecord.accuracies} />}

                    {this.state.viewType === "chartView" && this.state.currTrainRecord &&
                        <TrainChart
                            accuracies={this.state.currTrainRecord.accuracies}
                            modelId={this.state.currTrainRecord.modelInfo.modelId}
                            projectTags={this.props.project.tags} />
                    }
                </main>
                <div className="train-page-menu bg-lighter-1">
                    <div className="condensed-list">
                        <div className="condensed-list-body">
                            <div className="m-3">
                                <h4 className="text-shadow-none"> Train a new model </h4>
                                {/*<div className="alert alert-warning warning train-notification">*/}
                                {/*    <FontIcon iconName="WarningSolid"></FontIcon>*/}
                                {/*    <span className="train-notification-text">*/}
                                {/*        {strings.train.backEndNotAvailable}*/}
                                {/*    </span>*/}
                                {/*</div>*/}
                                {!this.state.isTraining ? (
                                    <PrimaryButton
                                        id="train_trainButton"
                                        theme={getPrimaryGreenTheme()}
                                        autoFocus={true}
                                        className="flex-center"
                                        onClick={this.handleTrainClick}>
                                        <FontIcon iconName="MachineLearning" />
                                        <h6 className="d-inline text-shadow-none ml-2 mb-0"> {strings.train.title} </h6>
                                    </PrimaryButton>
                                ) : (
                                    <div className="loading-container">
                                        <Spinner
                                            label="Training in progress..."
                                            ariaLive="assertive"
                                            labelPosition="right"
                                            size={SpinnerSize.large}
                                        />
                                    </div>
                                )
                                }
                            </div>
                            <div className={!this.state.isTraining ? "" : "greyOut"}>
                                {this.state.currTrainRecord &&
                                    <TrainPanel
                                        currTrainRecord={this.state.currTrainRecord}
                                        viewType={this.state.viewType}
                                        updateViewTypeCallback={this.handleViewTypeClick}
                                    />
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Alert
                    show={this.state.showTrainingFailedWarning}
                    title="Training Failed"
                    message={this.state.trainingFailedMessage}
                    onClose={() => this.setState({ showTrainingFailedWarning: false })}
                />
                <PreventLeaving
                    when={this.state.isTraining}
                    message={"A training operation is currently in progress, are you sure you want to leave?"}
                />
                <SkipButton skipTo="pageTrain">{strings.common.skipToMainContent}</SkipButton>
            </div>
        );
    }

    private handleTrainClick = async () => {
        this.setState({
            isTraining: true,
            trainMessage: strings.train.training,
        });

        this.trainProcess().then((trainResult) => {
            this.setState((prevState, props) => ({
                isTraining: false,
                trainMessage: this.getTrainMessage(trainResult),
                // currTrainRecord: this.getProjectTrainRecord(),
            }));
        }).catch((err) => {
            this.setState({
                isTraining: false,
                trainMessage: err.message,
            });
        });
        console.log(this.state.currTrainRecord);
    }

    private handleViewTypeClick = (viewType: "tableView" | "chartView"): void => {
        this.setState({ viewType });
    }

    private async trainProcess(): Promise<any> {
        try {
            const trainRes = await this.train();
            console.log(trainRes);
            const trainStatusRes =
                await this.getTrainStatus(trainRes.headers["location"]);
            console.log(trainStatusRes);
            const updatedProject = this.buildUpdatedProject(
                this.parseTrainResult(trainStatusRes),
            );
            await this.props.actions.saveProject(updatedProject);

            await this.props.actions.loadProject(this.props.project);
            this.props.appTitleActions.setTitle(this.props.project.name);
            this.updateCurrTrainRecord(this.parseTrainResult(trainStatusRes));
            console.log(this.parseTrainResult(trainStatusRes));
            console.log(this.state.currTrainRecord);
            return trainStatusRes;
        } catch (errorMessage) {
            this.setState({
                showTrainingFailedWarning: true,
                trainingFailedMessage: (errorMessage !== undefined && errorMessage.message !== undefined
                    ? errorMessage.message : errorMessage),
            });
        }
    }

    private getSubFolder(project: IProject) {
        if (project.projectType === strings.appSettings.projectType.origin) {
            return path.join(this.props.project.folderPath, "type2");
        } else if (project.projectType === strings.appSettings.projectType.completed) {
            return path.join(this.props.project.folderPath, "type2");
        } else {
            return path.join(this.props.project.folderPath, "type3");
        }
    }

    private getKind(project: IProject) {
        if (project.projectType === strings.appSettings.projectType.origin) {
            return AssetKind.Normal;
        } else if (project.projectType === strings.appSettings.projectType.completed) {
            return AssetKind.Normal;
        } else {
            return AssetKind.Fake;
        }
    }

    private async train(): Promise<any> {
        const assets = await this.props.actions.loadAssets(this.props.project);
        const ocrService = new OCRService(this.props.project);
        try {
            await throttle(
                constants.maxConcurrentServiceRequests,
                assets.filter((asset) => asset.kind === this.getKind(this.props.project)).map((asset) => asset.id),
                async (assetId) => {
                    // Get the latest version of asset.
                    const asset = assets.find((asset) => asset.id === assetId);
                    try {
                        await ocrService.getRecognizedText(asset.path, asset.name);
                    } catch (err) {
                        console.log(err);
                    }
                });
        } catch (err) {
            console.log(err);
        }

        if (this.props.project.projectType === strings.appSettings.projectType.completed) {
            const requestOptions = {
                // mode: "no-cors" as RequestMode,
                method: "GET",
            };
            await fetch(`https://lyceshi.azurewebsites.net/api/Recognize?path=${this.props.project.folderPath}`,
                requestOptions)
                .then((response) => {
                    console.log(response);
                    if (response.ok) {
                        toast.success("Recognize success.");
                    } else {
                        toast.error("Recognize failed.");
                    }
                });
        }

        await delay(1000);

        const baseURL = url.resolve(
            this.props.project.apiUriBase,
            constants.apiModelsPath,
        );
        const provider = this.props.project.sourceConnection.providerOptions as any;
        const trainSourceURL = provider.sas;

        const payload = {
            source: trainSourceURL,
            sourceFilter: {
                prefix: this.props.project.folderPath ? this.getSubFolder(this.props.project) : "",
                includeSubFolders: false,
            },
            useLabelFile: true,
        };
        try {
            return await ServiceHelper.postWithAutoRetry(
                baseURL,
                payload,
                {},
                this.props.project.apiKey as string,
            );
        } catch (err) {
            ServiceHelper.handleServiceError(err);
        }
    }

    private async getTrainStatus(operationLocation: string): Promise<any> {
        const timeoutPerFileInMs = 10000;  // 10 second for each file
        const minimumTimeoutInMs = 300000;  // 5 minutes minimum waiting time  for each traingin process
        const extendedTimeoutInMs = timeoutPerFileInMs * Object.keys(this.props.project.assets || []).length;
        return this.poll(() => {
            return ServiceHelper.getWithAutoRetry(
                operationLocation,
                {headers: {"cache-control": "no-cache"}},
                this.props.project.apiKey as string);
        }, Math.max(extendedTimeoutInMs, minimumTimeoutInMs), 1000);
    }

    private buildUpdatedProject = (newTrainRecord: ITrainRecordProps): IProject => {
        return {
            ...this.props.project,
            trainRecord: newTrainRecord,
        };
    }

    private getTrainMessage = (trainingResult): string => {
        if (trainingResult !== undefined && trainingResult.modelInfo !== undefined
            && trainingResult.modelInfo.status === "ready") {
            return "Trained successfully";
        }
        return "Training failed";
    }

    private getProjectTrainRecord = (): ITrainRecordProps => {
        return _.get(this, "props.project.trainRecord", null);
    }

    private updateCurrTrainRecord = (curr: ITrainRecordProps): void => {
        this.setState({ currTrainRecord: curr });
    }

    private parseTrainResult = (response: ITrainApiResponse): ITrainRecordProps => {
        return {
            modelInfo: {
                modelId: response["modelInfo"]["modelId"],
                createdDateTime: response["modelInfo"]["createdDateTime"],
            },
            averageAccuracy: response["trainResult"]["averageModelAccuracy"],
            accuracies: this.buildAccuracies(response["trainResult"]["fields"]),
        };
    }

    private buildAccuracies = (fields: object[]): object => {
        const accuracies = {};
        for (const field of fields) {
            accuracies[field["fieldName"]] = field["accuracy"];
        }
        return accuracies;
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
                if (response.data.modelInfo && response.data.modelInfo.status === "ready") {
                    resolve(response.data);
                } else if (response.data.modelInfo && response.data.modelInfo.status === "invalid") {
                    const message = _.get(
                        response,
                        "data.trainResult.errors[0].message",
                        "Sorry, we got errors while training the model.");
                    reject(message);
                } else if (Number(new Date()) < endTime) {
                    // If the request isn't succeeded and the timeout hasn't elapsed, go again
                    setTimeout(checkSucceeded, interval, resolve, reject);
                } else {
                    // Didn't succeeded after too much time, reject
                    reject(new Error("Timed out, sorry, it seems the training process took too long."));
                }
            });
        };

        return new Promise(checkSucceeded);
    }
}
