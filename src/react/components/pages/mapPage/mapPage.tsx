import React from "react";
import {connect} from "react-redux";
import {Spinner, SpinnerSize} from "office-ui-fabric-react/lib/Spinner";
import {IApplicationState, IAppSettings, IConnection, IProject} from "../../../../models/applicationState";
import {bindActionCreators} from "redux";
import * as projectActions from "../../../../redux/actions/projectActions";
import * as applicationActions from "../../../../redux/actions/applicationActions";
import * as appTitleActions from "../../../../redux/actions/appTitleActions";
import {RouteComponentProps} from "react-router-dom";
import IProjectActions from "../../../../redux/actions/projectActions";
import IApplicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions from "../../../../redux/actions/appTitleActions";
import ReactEcharts from "echarts-for-react";
import "echarts/map/js/world";
import {genMap} from "./mapPageComponent";

export interface IMapPageProps extends RouteComponentProps, React.Props<MapPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IMapPageState {
    isLoadingMap: boolean;
    mapContent: any;
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

const initMapContent = "<div>no map available</div>";

@connect(mapStateToProps, mapDispatchToProps)
export default class MapPage extends React.Component<IMapPageProps, IMapPageState> {
    public state: IMapPageState = {
        isLoadingMap: false,
        mapContent: initMapContent,
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            await this.onFetch();
            await this.renderMapContent();
            this.props.appTitleActions.setTitle(project.name);
        }
    }

    public componentDidUpdate() {
        this.renderMapContent();
    }

    public render() {
        return (
            <div className="app-mappage">
                <div className="app-mappage-main">
                    {
                        !this.state.isLoadingMap ?
                            <div>
                                <ReactEcharts option={genMap(undefined)}
                                              style={{width: window.innerWidth - 45, height: window.innerHeight - 60}}/>
                            </div> :
                            <div className="app-homepage-loading">
                                <div className="app-homepage-loading-spinner">
                                    <Spinner size={SpinnerSize.large} label={"Loading Map..."}
                                             ariaLive="assertive" labelPosition="right"/>
                                </div>
                            </div>
                    }
                </div>
            </div>
        );
    }

    private async onFetch() {
        this.setState({isLoadingMap: true, mapContent: initMapContent});
        if (this.props.project) {
            const requestOptions = {
                method: "GET",
            };
            // todo: get data
            // const res = await fetch(`https://lyceshi.azurewebsites.net/api/Download?path=${this.props.project.name}`,
            // requestOptions);
        }
        this.setState({isLoadingMap: false});
    }

    private renderMapContent = () => {
        const ele = document.getElementById("map-content");
        if (ele) {
            ele.innerHTML = this.state.mapContent;
        }
    }
}
