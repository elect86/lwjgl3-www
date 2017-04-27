import React from 'react';
import { withRouter } from 'react-router-dom';
import type { Location } from 'react-router-dom';

type Props = {
  location: Location,
  id: string,
};

class HashLinkTarget extends React.Component<void, Props, void> {
  componentDidMount() {
    if (this.props.location.hash === `#${this.props.id}`) {
      this.scrollToTarget();
    }
  }

  componentWillReceiveProps({ location, id }: Props) {
    if (location !== this.props.location) {
      if (location.hash === `#${id}`) {
        this.scrollToTarget();
      } else {
        window.scroll(0, 0);
      }
    }
  }

  scrollToTarget() {
    const el = document.getElementById(this.props.id);
    if (el !== null) {
      try {
        el.scrollIntoView({ behavior: 'smooth' });
      } catch (ignore) {}
    }
  }

  render() {
    return <a id={this.props.id} />;
  }
}

export default withRouter(HashLinkTarget);
