// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import {FontIcon, IconButton} from "office-ui-fabric-react";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import "./condensedList.scss";
import {IProject} from "../../../../models/applicationState";
import {strings} from "../../../../common/strings";

/**
 * Properties for Condensed List Component
 * @member title - Title of condensed list
 * @member items - Array of items to be rendered
 * @member newLinkTo - Link for list items
 * @member newLinkToTitle - Title of newLink
 * @member onClick - Function to call on clicking items
 * @member onDelete - Function to call on deleting items
 * @member Component - Component to be rendered for list items
 */
interface ICondensedListProps {
    title: string;
    Component: any;
    items: any[];
    newLinkTo?: string;
    newLinkToTitle?: string;
    onClick?: (item) => void;
    onDelete?: (item) => void;
    withMultiDelete?: boolean;
    onDeletes?: (items) => void;
}

interface ICondensedListState {
    selectedItems: IProject[];
    deleteMode: boolean;
}

/**
 * @name - Condensed List
 * @description - Clickable, deletable and linkable list of items
 */
export default class CondensedList extends React.Component<ICondensedListProps, ICondensedListState> {
    constructor(props, context) {
        super(props, context);

        this.onItemClick = this.onItemClick.bind(this);
        this.onItemDelete = this.onItemDelete.bind(this);
        this.onItemsDelete = this.onItemsDelete.bind(this);
        this.state = { selectedItems: [], deleteMode: false };
    }
    public quitDeleteMode = () => {
        this.setState({ selectedItems: [], deleteMode: false });
    }

    public render() {
        const { title, items, newLinkTo, newLinkToTitle, Component, withMultiDelete } = this.props;

        return (
            <div className="condensed-list">
                <div className="condensed-list-header bg-darker-2">
                    <span>{title}</span>
                    {newLinkTo &&
                        <Link to={newLinkTo} className="float-right add-button" role="button" title={newLinkToTitle}
                            id="addConnection">
                            <FontIcon iconName="Add" />
                        </Link>
                    }
                    <IconButton className="float-right app-delete-button"
                        title={!this.state.deleteMode ? strings.common.deleteMode : strings.common.cancel}
                        onClick={() => {
                            this.setState({ deleteMode: !this.state.deleteMode, selectedItems: []});
                        }}>
                            <FontIcon iconName={!this.state.deleteMode ? "Delete" : "ReturnKey"}
                                      className="app-delete-icon"/>
                    </IconButton>
                    {
                        this.state.deleteMode &&
                        <IconButton className="float-right app-delete-button"
                            title={strings.common.submitDelete}
                            onClick={this.onItemsDelete}>
                                <FontIcon iconName={"Delete"}
                                          className="app-delete-icon"/>
                        </IconButton>
                    }
                </div>
                <div className="condensed-list-body">
                    {(!items) &&
                        <div className="p-3 text-center">
                            <Spinner size={SpinnerSize.small} />
                        </div>
                    }
                    {(items && items.length === 0) &&
                        <div className="p-3 text-center">No items found</div>
                    }
                    {(items && items.length > 0) &&
                        withMultiDelete ?
                        <ul className="condensed-list-items">
                            {items.map((item) => <Component key={item.id}
                                item={item}
                                onClick={(e) => this.onItemClick(e, item)}
                                selectedItems={this.state.selectedItems}
                                onSelect={(e) => this.onSelect(e, item)}
                                onUnSelect={(e) => this.onUnSelect(e, item)}
                                deleteMode={this.state.deleteMode}/>)}
                        </ul> :
                        <ul className="condensed-list-items">
                            {items.map((item) => <Component key={item.id}
                                item={item}
                                onClick={(e) => this.onItemClick(e, item)}
                                onDelete={(e) => this.onItemDelete(e, item)} />)}
                        </ul>
                    }
                </div>
            </div>
        );
    }

    private onItemClick = (e, item) => {
        if (this.props.onClick) {
            this.props.onClick(item);
        }
    }

    private onItemDelete = (e: SyntheticEvent, item) => {
        e.stopPropagation();
        e.preventDefault();

        if (this.props.onDelete) {
            this.props.onDelete(item);
        }
    }

    private onItemsDelete = () => {
        console.log("items delete", this.state.selectedItems);
        /*
        if (this.props.onDelete) {
            this.state.selectedItems.forEach((item) => this.props.onDelete(item));
        }
         */
        if (this.props.onDeletes) {
            this.props.onDeletes(this.state.selectedItems);
        }
    }

    private onSelect = (e, item) => {
        this.setState( {selectedItems: this.state.selectedItems.concat(item)});
        console.log(this.state.selectedItems.concat(item));
    }
    private onUnSelect = (e, item) => {
        this.setState( {selectedItems: this.state.selectedItems.filter((e) => e.id !== item.id)} );
        console.log(this.state.selectedItems.filter((e) => e.id !== item.id));
    }
}

/**
 * Generic list item with an onClick function and a name
 * @param param0 - {item: {name: ""}, onClick: (item) => void;}
 */
export function ListItem({ item, onClick }) {
    return (
        <li>
            {/* eslint-disable-next-line */}
            <a className="condensed-list-item" onClick={onClick}>
                <span className="px-2">{item.name}</span>
            </a>
        </li>
    );
}
