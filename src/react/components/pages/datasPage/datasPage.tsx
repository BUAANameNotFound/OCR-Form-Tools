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
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = strings.predict.title + " - " + strings.appName;
    }

    public render() {
        //const browseFileDisabled: boolean = !this.state.predictionLoaded;
        //const predictDisabled: boolean = !this.state.predictionLoaded || !this.state.file;
        //const predictions = this.getPredictionsFromAnalyzeResult(this.state.analyzeResult);
        //strings.predict.uploadFile是小标题之后的
        const browseFileDisabled: boolean = true;

        return (
            <div className="predict" id="pagePredict">
                <div className="predict-main">
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
                                    style = {{cursor: (browseFileDisabled ? "default" : "pointer")}}
                                    readOnly={true}
                                    className="dummyInputFile"
                                    aria-label={strings.datas.inputNumber}
                                    value={this.state.NumberLabel}/>
                                <div className="rlMargin10">
                                    <PrimaryButton
                                        theme={getPrimaryGreenTheme()}
                                        text="Generate"
                                        allowDisabledFocus
                                        disabled={browseFileDisabled}
                                        autoFocus={true}
                                    />
                                </div>
                                <PrimaryButton
                                    theme={getPrimaryWhiteTheme()}
                                    text="Download"
                                    aria-label={""}
                                    allowDisabledFocus
                                    disabled={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}