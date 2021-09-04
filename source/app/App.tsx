
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
          Hello Loaded Component onLoad() through Javascript itself {name}
          <BreadCrumbs color={"red"} anotherColor={""} backgroundColor={"black"} start={22} end={33} />
        </h1>
      </>
    );
  }
}

export default App;
