// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React from "react";
import {strings} from "../../../../common/strings";
/**
 * Properties for Connection Picker
 * @member id - ID for HTML select element
 * @member value - Selected value of picker
 * @member connections - Array of connections for choosing
 * @member onChange - Function to call on change of selection
 */
export interface IProjectTypePickerProps {
    id?: string;
    value: any;
    onChange: (value) => void;
}

/**
 * State for Connection Picker
 * @member value - Selected value
 */
export interface IProjectTypePickerState {
    value: any;
}

/**
 * @name - Connection Picker
 * @description - Enhanced dropdown for selecting a Connection
 */
export class ProjectTypePicker extends React.Component<IProjectTypePickerProps, IProjectTypePickerState> {
    constructor(props, context) {
        super(props, context);
        this.state = {
            value: this.props.value,
        };

        this.onChange = this.onChange.bind(this);
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value || null,
            });
        }
    }

    public render() {
        const { id } = this.props;
        const selectedValue = this.state.value ? this.state.value.id : "";

        return (
            <div className="input-group">
                <select id={id} value={selectedValue} onChange={this.onChange}
                    required className="form-control">
                    <option>Select Project Type</option>
                    <option>{strings.appSettings.projectType.blank}</option>
                    <option>{strings.appSettings.projectType.completed}</option>
                    <option>{strings.appSettings.projectType.sheet}</option>
                </select>
            </div>
        );
    }

    private onChange = (e) => {

        this.setState({
            value: e.target.value,
        });

        this.props.onChange(e.target.value);
    }

}
