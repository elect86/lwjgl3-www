import React from 'react';
import { PageView } from '~/components/routes/PageView';
import { BuildConfigurator } from './BuildConfigurator';
import { Provider } from './Store';

import type { RouteComponentProps, WindowLocation } from '@reach/router';

const CustomizeRoute = (props: RouteComponentProps) => (
  <PageView location={props.location as WindowLocation} title="Customize" description="Customize your LWJGL 3 build">
    <section className="container" style={{ position: 'relative' }}>
      <Provider>
        <BuildConfigurator />
      </Provider>
    </section>
  </PageView>
);

export default CustomizeRoute;
