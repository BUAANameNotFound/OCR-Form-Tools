// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import { NavLink } from "react-router-dom";
import { FontIcon } from "office-ui-fabric-react";
import ConditionalNavLink from "../common/conditionalNavLink/conditionalNavLink";
import { strings } from "../../../common/strings";

/**
 * Side bar that remains visible throughout app experience
 * Contains links to editor, settings, export, etc.
 * @param param0 - {
 *      project - IProject
 * }
 */
export function Sidebar({ project }) {
    const projectId = project ? project.id : null;
    const projectType = project ? project.projectType : null;

    return (
        <div className="bg-lighter-2 app-sidebar" id="appSidebar">
            <ul>
                <li>
                    <NavLink title={"Home"} to={`/`} exact role="button">
                        <FontIcon iconName="Home" />
                    </NavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title="Upload"
                        to={`/projects/${projectId}/upload`}>
                        <FontIcon iconName="TextDocument" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.tags.editor}
                        to={`/projects/${projectId}/edit`}>
                        <FontIcon iconName="Tag" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId ||
                        projectType === strings.appSettings.projectType.completed}
                                        title={strings.datas.title}
                                        to={`/projects/${projectId}/datas`}>
                        <FontIcon iconName="Table"/>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.train.title}
                        to={`/projects/${projectId}/train`}>
                        <FontIcon iconName="MachineLearning" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={`Predict`}
                        to={`/projects/${projectId}/predict`}>
                        <FontIcon iconName="Insights" />
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={`Map`}
                        to={`/projects/${projectId}/map`}>
                        <FontIcon iconName="MapPin" />
                    </ConditionalNavLink>
                </li>
                {/*<li>*/}
                {/*    <ConditionalNavLink disabled={!projectId}*/}
                {/*        title={strings.projectSettings.title}*/}
                {/*        to={`/projects/${projectId}/settings`}>*/}
                {/*        <FontIcon iconName="DocumentManagement" />*/}
                {/*    </ConditionalNavLink>*/}
                {/*</li>*/}
                {/*<li>*/}
                {/*    <NavLink title={strings.connections.title} to={`/connections`} role="button">*/}
                {/*        <FontIcon iconName="Plug" />*/}
                {/*    </NavLink>*/}
                {/*</li>*/}
            </ul>
            <div className="app-sidebar-fill"/>
            <ul>
                <li>
                    <NavLink title={strings.appSettings.title} to={`/settings`} role="button">
                        <FontIcon iconName="Settings" />
                    </NavLink>
                </li>
            </ul>
        </div>
    );
}
