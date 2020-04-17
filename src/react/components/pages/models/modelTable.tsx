// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";

export interface IModelTableProps {
    trainMessage: string;
    accuracies: object;
}

export interface IModelTableState {}

export default class ModelTable
    extends React.Component<IModelTableProps, IModelTableState> {

    public render() {
        return (
            <div className="train-accuracytable-container">
                {!this.props.accuracies && <table className="accuracytable">
                    <tbody>
                        <tr>
                            <th> Train Message </th>
                            <td> {this.props.trainMessage} </td>
                        </tr>
                    </tbody>
                </table>}
                {this.props.accuracies &&
                    <table className="accuracytable table-sm">
                        <tbody>
                            <tr>
                                <th>
                                    Tag
                                </th>
                                <th className="text-right">
                                    Estimated Accuracy
                                </th>
                            </tr>
                            {
                                Object.entries(this.props.accuracies).map((entry) =>
                                    <tr key={entry[0]}>
                                        <td>{entry[0]}</td>
                                        <td className="text-right">{(entry[1] * 100).toFixed(2) + "%"}</td>
                                    </tr>)
                            }
                        </tbody>
                    </table>
                }
            </div>
        );
    }
}
