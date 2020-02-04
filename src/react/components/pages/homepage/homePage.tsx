// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings, interpolate } from "../../../../common/strings";
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
    ErrorCode, AppError, IAppSettings
} from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { decryptProject } from "../../../../common/utils";
import { toast } from "react-toastify";

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
    };

    private deleteConfirm: React.RefObject<Confirm> = React.createRef();
    private cloudFilePicker: React.RefObject<CloudFilePicker> = React.createRef();

    public async componentDidMount() {
        this.props.appTitleActions.setTitle("Welcome");
    }

    public render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            {/* eslint-disable-next-line */}
                            <a href="#" onClick={this.createNewProject} className="p-5 new-project">
                                <i className="ms-Icon ms-Icon--AddTo ms-Icon-9x"></i>
                                <h6>{strings.homePage.newProject}</h6>
                            </a>
                        </li>
                        <li>
                            {/*Open Cloud Project*/}
                            {/* eslint-disable-next-line */}
                            <a href="#" onClick={this.handleOpenCloudProjectClick} className="p-5 cloud-open-project">
                                <i className="ms-Icon ms-Icon--Cloud ms-Icon-9x"></i>
                                <h6>{strings.homePage.openCloudProject.title}</h6>
                            </a>
                            <CloudFilePicker
                                ref={this.cloudFilePicker}
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
                            title={strings.homePage.recentProjects}
                            Component={RecentProjectItem}
                            items={this.props.recentProjects}
                            onClick={this.freshLoadSelectedProject}
                            onDelete={(project) => this.deleteConfirm.current.open(project)} />
                    </div>
                }
                <Confirm title="Delete Project"
                    ref={this.deleteConfirm as any}
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
            </div>
        );
    }

    private createNewProject = (e: SyntheticEvent) => {
        this.props.actions.closeProject();
        this.props.history.push("/projects/create");

        e.preventDefault();
    }

    private handleOpenCloudProjectClick = () => {
        this.cloudFilePicker.current.open();
    }

    private loadSelectedProject = async (project: IProject) => {
        await this.props.actions.loadProject(project);
        this.props.history.push(`/projects/${project.id}/edit`);
    }

    private freshLoadSelectedProject = async (project: IProject) => {
        // Lookup security token used to decrypt project settings
        const projectToken = this.props.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (!projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }

        // Load project from storage provider to keep the project in latest state
        const decryptedProject = decryptProject(project, projectToken);
        const storageProvider = StorageProviderFactory.createFromConnection(decryptedProject.sourceConnection);
        try {
            const projectStr = await storageProvider.readText(`${decryptedProject.name}${constants.projectFileExtension}`);
            const selectedProject = { ...JSON.parse(projectStr), sourceConnection: project.sourceConnection };
            await this.loadSelectedProject(selectedProject);
        } catch (err) {
            if (err instanceof AppError && err.errorCode === ErrorCode.BlobContainerIONotFound) {
                const reason = interpolate(strings.errors.projectNotFound.message, { file: `${project.name}${constants.projectFileExtension}`, container: project.sourceConnection.name });
                toast.error(reason, { autoClose: false });
                return;
            }
            throw err;
        }
    }

    private deleteProject = async (project: IProject) => {
        await this.props.actions.deleteProject(project);
    }
}