import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { FontIcon, PrimaryButton, Spinner, SpinnerSize, IconButton} from "office-ui-fabric-react";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IAppTitleActions, * as appTitleActions from "../../../../redux/actions/appTitleActions";
import "./modelPage.scss";
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

export interface IModelsPageProps extends RouteComponentProps, React.Props<ModelsPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    appSettings: IAppSettings;
    project: IProject;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appTitleActions: IAppTitleActions;
}

export interface IModelsPageState {
    NumberLabel: string;
    tagLoaded: boolean;
    dataQuantity: number; 
    dataQuantityLoaded: boolean;
    dataGenerateLoaded: boolean;
    isGenerating: boolean;

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
export default class ModelsPage extends React.Component<IModelsPageProps, IModelsPageState> {
    public state: IModelsPageState = {
        NumberLabel: "Project Name",
        tagLoaded: true,
        dataQuantity: 0,
        dataQuantityLoaded: false,
        dataGenerateLoaded: false,
        isGenerating: false,
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            await this.props.actions.loadProject(project);
            this.props.appTitleActions.setTitle(project.name);
        }
        document.title = strings.models.title + " - " + strings.appName;
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
                            <span className="condensed-list-title">History Models</span>
                        </h6>
                        <div className="p-3">
                            <h5>
                                {strings.models.Listmodels}
                            </h5>
                            <div style={{display: "flex", marginBottom: "25px"}}>
                                <input
                                    type="text"
                                    id="Project Name"
                                    style = {{cursor: (generateDisabled ? "default" : "pointer")}}
                                    ref={this.quantityInput}
                                    placeholder={this.state.NumberLabel}
                                    onChange={this.handleQuantityChange}
                                    disabled={inputDisabled}
                                    />
                                <div className="rlMargin10">
                                    <PrimaryButton
                                        theme={getPrimaryGreenTheme()}
                                        text="List"
                                        allowDisabledFocus
                                        disabled={generateDisabled}
                                        autoFocus={true}
                                        onClick={this.handleGenerateClick}
                                    />
                                </div>
                                <PrimaryButton
                                    theme={getPrimaryWhiteTheme()}
                                    text="Renew"
                                    aria-label={!this.state.dataGenerateLoaded ? strings.models.inProgress : ""}
                                    allowDisabledFocus
                                    disabled={downloadDisabled}
                                    onClick={this.handleDownloadClick}
                                />
                            </div>
                            {this.state.isGenerating &&
                            <div className="loading-container">
                                <Spinner
                                    label={strings.models.inProgress}
                                    ariaLive="assertive"
                                    labelPosition="right"
                                    size={SpinnerSize.large}
                                />
                            </div>
                            }
                        </div>
                    </div>
                </div>
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
                this.setState({
                    isGenerating: false,
                    dataGenerateLoaded: true,
                });
            }).catch((error) => {

            });
    }

    private handleDownloadClick = () => {
    }

    private async getDatasGenerate(): Promise<any> {
    }
}