import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, IconButton} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
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
import CondensedList from "../../common/condensedList/condensedList";
import ModelItem from "./modelItem";
import Confirm from "../../common/confirm/confirm";
//import TrainChart from "./trainChart";
//import TrainPanel from "./trainPanel";
import ModelTable from "./modelTable";
import { IModelRecordProps } from "./modelRecord";
import "./modelPage.scss";

export interface IModelPageProps extends RouteComponentProps, React.Props<ModelsPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IModelPageState {
    currTrainRecord: [];
    viewType: "chartView" | "tableView";
    modelMessage:string;

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
export default class ModelsPage extends React.Component<IModelPageProps, IModelPageState> {
    private confirmDelete: React.RefObject<Confirm>;

    
    constructor(props) {
        super(props);

        this.state = {
            modelMessage: "OK!",
            currTrainRecord: [],
            viewType: "tableView",

        };
    }
    
    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);

            this.props.appTitleActions.setTitle(project.name);
            // this.updateCurrTrainRecord(this.getProjectTrainRecord());
            const endpointURL = url.resolve(
                this.props.project.apiUriBase,
                `${constants.apiModelsPath}?op=full`,
            );
            let response;
            response = await ServiceHelper.getWithAutoRetry(
                endpointURL, 
                { headers: { "cache-control": "no-cache" } },
                this.props.project.apiKey as string);
            console.log("response:")
            console.log(response)
            console.log(response.data.modelList)
            this.setState({
                currTrainRecord: response.data.modelList
            })
        }
        document.title = strings.train.title + " - " + strings.appName;
    }

    public render() {
        const currTrainRecord = this.state.currTrainRecord;

        return (
            <div className="models" id="pageModels" style={{margin: '24px'}}>
                <div className="models-main">
                </div>

                 {/* <div className="datas-sidebar bg-lighter-1">
                    <div className="condensed-list">
                        <h6 className="condensed-list-header bg-darker-2 p-2 flex-center">
                            <FontIcon className="mr-1" iconName="Insights" />
                            <span className="condensed-list-title">History Models</span> 
                        </h6>
                    </div>
                </div> */}

                {/* <div className="app-connections-page-list-bg-lighter-1">
                    <CondensedList
                        title={strings.models.title}
                        //newLinkTo={"/connections/create"}
                        //newLinkToTitle={strings.connections.new}
                        onDelete={(connection) => this.confirmDelete.current.open(connection)}
                        Component={ModelItem}
                        items={this.props.connections} />
                </div> */}

                <div className = "model_history" >
                    {/* {currTrainRecord &&
                        <div>
                            <h3> Model Messag </h3>
                            <h4> Model ID: {currTrainRecord.modelInfo.modelId} </h4>
                        </div>
                    } */}
                        <table className="accuracytable table-sm">
                        <tbody>
                            <tr>
                                <th>modelId</th>
                                <th>status</th>
                                <th>createdDateTime</th>
                                <th className="text-right">lastUpdatedDateTime</th>
                            </tr>
                            { currTrainRecord && 
                            currTrainRecord.map((item:any) =>
                                    <tr >
                                        <td>{item.modelId}</td>
                                        <td>{item.status}</td>
                                        <td>{item.createdDateTime}</td>
                                        <td className="text-right">{item.lastUpdatedDateTime}</td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                </div>

                


            </div>
        );
    }



    private getProjectTrainRecord = (): IModelRecordProps => {
        return _.get(this, "props.project.trainRecord", null);
    }

}