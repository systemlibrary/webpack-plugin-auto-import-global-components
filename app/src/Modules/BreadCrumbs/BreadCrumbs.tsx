import React, { useState } from "react";

export interface BreadcrumbProps {
    color: string,
    backgroundColor: string,
    start: number,
    end: number
}

export const HelloWorld = () => { console.log("hello!") }

export class Cars { }

export default class BreadCrumbs extends React.Component<BreadcrumbProps, {}>
{
    public render() {
        const color = "color--" + this.props.color;
        const backgroundColor = "color--" + this.props.backgroundColor;

        return (
            <div className="breadcrumbs">
                <div className={"breadcrumbs-container " + color + " " + backgroundColor}>
                    <ul>
                        <li>Breadcrumbs from react through auto-exported plugin</li>
                        <li>Classes passed: {this.props.color} and {this.props.backgroundColor}</li>
                        <li>Start value from C# {this.props.start}</li>
                        <li>End value from C#  {this.props.end}</li>
                    </ul>
                </div>
            </div >
        );
    }
}