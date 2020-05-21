// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {FontIcon, IconButton, Modal} from "office-ui-fabric-react";
import {strings} from "../../../common/strings";
import "./helpMenu.scss";
import {usageEn} from "../../../assets/markdown/usage_en";
import {markdown} from "markdown";

// import marked from "marked";

export interface IHelpMenuProps {
}

export interface IHelpMenuState {
    helpModalOpen: boolean;
}

export class HelpMenu extends React.Component<IHelpMenuProps, IHelpMenuState> {
    public state: IHelpMenuState = {
        helpModalOpen: false,
    };

    private akaMsLink = "https://aka.ms/form-recognizer/docs/label";
    private markdownContent = markdown.toHTML(usageEn);

    public render() {
        return (
            <div>
                <a
                    className={"help-menu-button"}
                    title={strings.titleBar.help}
                    onClick={this.handleClickHelpButton}
                    role="button"
                    target="_blank"
                    rel="noopener noreferrer">
                    <FontIcon iconName="Help"/>
                </a>
                <Modal isOpen={this.state.helpModalOpen}
                       onLayerDidMount={this.renderMarkdownContent}
                       isBlocking={false}
                       onDismiss={this.handleCloseModal}>
                    <div className="help-menu-container"
                         style={{width: document.body.clientWidth * 0.7}}>
                        <div className="help-menu-container-header">
                            {/*某些图标不起作用，https://github.com/microsoft/fluentui/issues/12529*/}
                            <IconButton iconProps={{iconName: "Cancel"}}
                                        title="Close" ariaLabel="Close"
                                        className="help-menu-container-header-icon"
                                        onClick={this.handleCloseModal}/>
                            <h3>Help Wiki</h3>
                            <a href={"https://github.com/BUAANameNotFound/OCR-Form-Tools"}
                               style={{color: "black"}}>**View Source Code**</a>
                        </div>
                        <div className="help-menu-container-body">
                            <div id={"markdown-content"}/>
                            <a href={"https://www.bilibili.com/video/bv1Lz411z7D6"}
                               style={{color: "black"}}>
                                <strong>
                                    **Click Here for Video**
                                </strong>
                            </a>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    private handleClickHelpButton = () => {
        this.setState({helpModalOpen: true});
    }

    private handleCloseModal = () => {
        this.setState({helpModalOpen: false});
    }

    private renderMarkdownContent = () => {
        document.getElementById("markdown-content").innerHTML = this.markdownContent;
    }
}
