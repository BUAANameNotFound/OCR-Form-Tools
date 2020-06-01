// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon } from "office-ui-fabric-react";
import { strings, interpolate } from "../../../../common/strings";
import { getPrimaryRedTheme } from "../../../../common/themes";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import "./homePage.scss";
import RecentProjectItem from "./recentProjectItem";
import { constants } from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject,
    ErrorCode, AppError, IAppSettings,
} from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import {decryptProject} from "../../../../common/utils";
import { toast } from "react-toastify";
import { SkipButton } from "../../shell/skipButton";
import {Spinner, SpinnerSize} from "office-ui-fabric-react/lib/Spinner";

export interface IHomePageProps extends RouteComponentProps, React.Props<HomePage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appSettings: IAppSettings;
    project: IProject;
    appTitleActions: IAppTitleActions;
}

export interface IHomePageState {
    cloudPickerOpen: boolean;
    onDeleteProject: boolean;
    onLoadProject: string | undefined;
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
export default class HomePage extends React.Component<IHomePageProps, IHomePageState> {

    public state: IHomePageState = {
        cloudPickerOpen: false,
        onDeleteProject: false,
        onLoadProject: undefined,
    };

    private newProjectRef = React.createRef<HTMLAnchorElement>();
    private deleteConfirmRef = React.createRef<Confirm>();
    private cloudFilePickerRef = React.createRef<CloudFilePicker>();
    private condensedListRef = React.createRef<CondensedList>();

    public async componentDidMount() {
        this.props.appTitleActions.setTitle("Welcome");
        // this.newProjectRef.current.focus();
        document.title = strings.homePage.title + " - " + strings.appName;
    }

    public async componentDidUpdate() {
        // this.newProjectRef.current.focus();
    }

    public render() {
        const onDeleteSpin = () => {
            return (
                <div className="app-homepage" id="pageHome">
                    <div className="app-homepage-main">
                        <div className="app-homepage-loading">
                            <div className="app-homepage-loading-spinner">
                                <Spinner size={SpinnerSize.large} label={"Deleting Project...."}
                                         ariaLive="assertive" labelPosition="right"/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        const onLoadSpin = (name: string) => {
            return (
                <div className="app-homepage" id="pageHome">
                    <div className="app-homepage-main">
                        <div className="app-homepage-loading">
                            <div className="app-homepage-loading-spinner">
                                <Spinner size={SpinnerSize.large} label={`Loading Project ${name}....`}
                                         ariaLive="assertive" labelPosition="right"/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        return (
            this.state.onDeleteProject ?
                onDeleteSpin() :
            this.state.onLoadProject ?
                onLoadSpin(this.state.onLoadProject) :
            <div className="app-homepage" id="pageHome">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            {/* eslint-disable-next-line */}
                            <a ref={this.newProjectRef}
                                id="home_newProject"
                                href="#" onClick={this.createNewProject} className="p-5 new-project" role="button">
                                <FontIcon iconName="AddTo" className="icon-9x" />
                                <div>{strings.homePage.newProject}</div>
                            </a>
                        </li>
                        <li>
                            {/*Open Cloud Project*/}
                            {/* eslint-disable-next-line */}
                            <a href="#" onClick={this.handleOpenCloudProjectClick}
                                className="p-5 cloud-open-project" role="button">
                                <FontIcon iconName="Cloud" className="icon-9x" />
                                <div>{strings.homePage.openCloudProject.title}</div>
                            </a>
                            <CloudFilePicker
                                ref={this.cloudFilePickerRef}
                                connections={this.props.connections}
                                onSubmit={(content) => this.loadSelectedProject(JSON.parse(content))}
                                fileExtension={constants.projectFileExtension}
                            />
                        </li>
                    </ul>
                </div>
                {(this.props.recentProjects && this.props.recentProjects.length > 0) &&
                    <div className="app-homepage-recent bg-lighter-1">
                        <CondensedList
                            ref={this.condensedListRef}
                            title={strings.homePage.recentProjects}
                            Component={RecentProjectItem}
                            items={this.props.recentProjects}
                            onClick={this.freshLoadSelectedProject}
                            onDelete={(project) => this.deleteConfirmRef.current.open(project)}
                            onDeletes={(projects) => this.deleteConfirmRef.current.open(projects)}
                            withMultiDelete={true}/>
                    </div>
                }
                <Confirm title="Delete Project"
                    ref={this.deleteConfirmRef as any}
                    message={this.genMessage}
                    confirmButtonTheme={getPrimaryRedTheme()}
                    onConfirm={this.deleteProjects}/>
                <SkipButton skipTo="pageHome">{strings.common.skipToMainContent}</SkipButton>
            </div>
        );
    }

    private createNewProject = (e: SyntheticEvent) => {
        this.props.actions.closeProject();
        this.props.history.push("/projects/create");

        e.preventDefault();
    }

    private handleOpenCloudProjectClick = () => {
        this.cloudFilePickerRef.current.open();
    }

    private loadSelectedProject = async (project: IProject) => {
        const ret = await this.props.actions.loadProject(project);
        if (ret == null) {
            return;
        }
        this.props.history.push(`/projects/${project.id}/edit`);
    }

    private freshLoadSelectedProject = async (project: IProject) => {
        this.setState({onLoadProject: project.name});
        // Lookup security token used to decrypt project settings
        const projectToken = this.props.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (!projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }

        // Load project from storage provider to keep the project in latest state
        const decryptedProject = await decryptProject(project, projectToken);
        const storageProvider = StorageProviderFactory.createFromConnection(decryptedProject.sourceConnection);
        try {
            let projectStr: string;
            try {
                projectStr = await storageProvider.readText(
                    `${decryptedProject.name}${constants.projectFileExtension}`);
            } catch (err) {
                if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                    // try old file extension
                    projectStr = await storageProvider.readText(
                        `${decryptedProject.name}${constants.projectFileExtensionOld}`);
                    this.setState({onLoadProject: undefined});
                } else {
                    this.setState({onLoadProject: undefined});
                    throw err;
                }
            }
            const selectedProject = { ...JSON.parse(projectStr), sourceConnection: project.sourceConnection };
            await this.loadSelectedProject(selectedProject);
            this.setState({onLoadProject: undefined});
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.projectNotFound.message, { file: `${project.name}${constants.projectFileExtension}`, container: project.sourceConnection.name });
                toast.error(reason, { autoClose: false });
                this.setState({onLoadProject: undefined});
                return;
            }
            this.setState({onLoadProject: undefined});
            throw err;
        }
    }

    private deleteProjects = (projects: IProject[]) => {
        this.setState({onDeleteProject: true});
        if (Array.isArray(projects)) {
            projects.forEachAsync((p) => this.deleteProject(p)).then(() => {
                this.setState({onDeleteProject: false});
                this.condensedListRef.current.quitDeleteMode();
            });
        }
    }

    private deleteProject = async (project: IProject) => {
        await this.props.actions.deleteProject(project);
        const requestOptions = {
            method: "GET",
        };
        await fetch(`https://lyniupi.azurewebsites.net/api/DeletePro?path=${project.folderPath}`, requestOptions);
    }

    private genMessage = (items: any) => {
        if (Array.isArray(items)) {
            let str = strings.homePage.deleteProject.confirmation + "\n";
            items.forEach((p) => str = str.concat(p.name + "\n"));
            return str;
        } else {
            return (`${strings.homePage.deleteProject.confirmation} ${items.name}?`);
        }
    }
}
