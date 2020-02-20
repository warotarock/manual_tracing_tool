import * as React from 'react';
import * as ReactDOM from 'react-dom';

class ReactLib {

    static GetReact() {

        return React;
    }

    static GetReactDOM() {

        return ReactDOM;
    }
}

window["ReactLib"] = ReactLib;