import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

import { useAdminAuthStore } from './store/useAdminAuthStore';
import { Login } from './pages/Login';
import { TabsLayout } from './layouts/TabsLayout';
import { FlowEdit } from './pages/FlowEdit';

setupIonicReact();

interface GuardedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}

const PublicOnly: React.FC<GuardedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated());
  return (
    <Route
      {...rest}
      render={(props) => (isAuthenticated ? <Redirect to="/app/flows" /> : <Component {...props} />)}
    />
  );
};

const RequireAuth: React.FC<GuardedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated());
  return (
    <Route
      {...rest}
      render={(props) => (isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
};

const Root: React.FC = () => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Redirect to="/app/flows" />;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <PublicOnly path="/login" component={Login} exact />
        <RequireAuth path="/flows/:id" component={FlowEdit} exact />
        <RequireAuth path="/flows/new" component={FlowEdit} exact />
        <RequireAuth path="/app" component={TabsLayout} />
        <Route exact path="/" component={Root} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
