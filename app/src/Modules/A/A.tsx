import React, { useState } from "react";

export interface AProps {
    i: number
}


export default class A extends React.Component<AProps, {}>
{
    public render() {
        return (
            <div className="a">
                <h3>Got value {this.props.i}</h3>
            </div >
        );
    }
}