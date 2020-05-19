// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {FontIcon} from "office-ui-fabric-react";
import {Modal, ModalBody, ModalHeader} from "reactstrap";
import {strings} from "../../../common/strings";
import "./helpMenu.scss";
import {markdown} from "markdown";
import {usageEn} from "../../../assets/markdown/usage_en";

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
                       onOpened={this.renderMarkdownContent}
                       className="help-menu-modal">
                    <ModalHeader
                        toggle={this.handleCloseModal}
                        close={
                            <button className="close" onClick={this.handleCloseModal}>&times;</button>
                        }>
                        Page Help
                    </ModalHeader>
                    <ModalBody>
                        <div id={"markdown-content"}/>
                    </ModalBody>
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
