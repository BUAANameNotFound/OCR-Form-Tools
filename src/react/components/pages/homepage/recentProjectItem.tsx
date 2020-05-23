// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {FontIcon} from "office-ui-fabric-react";
import "../../../../App.scss";

export default function RecentProjectItem({item, onClick, selectedItems, onSelect, onUnSelect, deleteMode}) {
    // const selected = selectedItems.filter((e) => e.id === item.id).length > 0;
    const selected = selectedItems.includes(item);

    return (
        <li className="recent-project-item">
            {/* eslint-disable-next-line */}
            <a className={!selected ? "condensed-list-item" : "condensed-list-item-delete"}
               href="#" onClick={!deleteMode ? onClick : selected ? onUnSelect : onSelect}
               aria-label={`${item.name} project`}>
                {!deleteMode ?
                    <FontIcon iconName="OpenFolderHorizontal"/> :
                    <FontIcon iconName="Delete"/>
                }
                <span className="px-2 ms-Fabric" style={{color: "inherit"}}>{item.name}</span>
                {/*
                    deleteMode &&
                    <IconButton className="float-right app-delete-button"
                        title={strings.common.delete}
                        onClick={!deleteMode ? onDelete : selected ? onClickUnSelect : onClickSelect}>
                    <FontIcon iconName="Delete" className="app-delete-icon"/>
                    </IconButton>
                */}
            </a>
        </li>
    );
}
