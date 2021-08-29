
import * as React from 'react';
import BreadCrumbs from './Modules/BreadCrumbs/BreadCrumbs';

interface Props {
  name:
  string
}


class App extends React.Component<Props> {
  render() {
    const { name } = this.props;
    return (
      <>
        <h1>
          Hello {name}
          <BreadCrumbs color={"red"} backgroundColor={"black"} start={1} end={3} />
        </h1>
      </>
    );
  }
}

export default App;
