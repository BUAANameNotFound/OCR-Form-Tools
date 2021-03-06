// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ActionTypes } from "../actions/actionTypes";
import { IProject, ITag } from "../../models/applicationState";
import { AnyAction } from "../actions/actionCreators";
// tslint:disable-next-line:no-var-requires
const tagColors = require("../../react/components/common/tagColors.json");

/**
 * Reducer for project. Actions handled:
 * DELETE_PROJECT_SUCCESS
 * CLOSE_PROJECT_SUCCESS
 * LOAD_PROJECT_SUCCESS
 * SAVE_PROJECT_SUCCESS
 * LOAD_PROJECT_ASSETS_SUCCESS
 * SAVE_ASSET_METADATA_SUCCESS
 * @param state - Current project
 * @param action - Action that was dispatched
 */
export const reducer = (state: IProject = null, action: AnyAction): IProject => {
    // state旧状态，action.payload新状态
    switch (action.type) {
        case ActionTypes.DELETE_PROJECT_SUCCESS:
        case ActionTypes.CLOSE_PROJECT_SUCCESS:
            return null;
        case ActionTypes.LOAD_PROJECT_SUCCESS:
            return {...action.payload};
        case ActionTypes.SAVE_PROJECT_SUCCESS:
            // 目前只涉及tag改动
            if (state) {
                const tags = action.payload.tags;
                return {...state, tags};
            } else {
                return state;
            }
        case ActionTypes.LOAD_ASSET_METADATA_SUCCESS:
            if (!state) {
                return state;
            }

            return {
                ...state,
                lastVisitedAssetId: action.payload.asset.id,
            };
        case ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS:
            // 加载asset
            const assets = {};
            action.payload.forEach((asset) => {
                assets[asset.id] = asset;
            });

            return {
                ...state,
                assets,
            };
        case ActionTypes.SAVE_ASSET_METADATA_SUCCESS:
            if (!state) {
                return state;
            }

            const updatedAssets = { ...state.assets } || {};
            updatedAssets[action.payload.asset.id] = { ...action.payload.asset };

            const assetTags = new Set();
            action.payload.regions.forEach((region) => region.tags.forEach((tag) => assetTags.add(tag)));

            const newTags: ITag[] = state.tags ? [...state.tags] : [];
            let updateTags = false;

            assetTags.forEach((tag) => {
                if (!state.tags || state.tags.length === 0 ||
                    !state.tags.find((projectTag) => tag === projectTag.name)) {
                    newTags.push({
                        name: tag,
                        color: tagColors[newTags.length % tagColors.length],
                    } as ITag);
                    updateTags = true;
                }
            });

            if (updateTags) {
                return {
                    ...state,
                    tags: newTags,
                    assets: updatedAssets,
                };
            }

            return {
                ...state,
                assets: updatedAssets,
            };

        case ActionTypes.UPDATE_PROJECT_TAGS_FROM_FILES_SUCCESS:
            return {
                ...state,
                tags: action.payload.tags,
            };

        case ActionTypes.SAVE_CONNECTION_SUCCESS:
            if (!state) {
                return state;
            }

            return {
                ...state,
                sourceConnection: state.sourceConnection.id === action.payload.id
                    ? { ...action.payload }
                    : state.sourceConnection,
            };
        default:
            return state;
    }
};
