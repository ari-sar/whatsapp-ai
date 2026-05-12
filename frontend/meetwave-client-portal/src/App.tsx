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

import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { TabsLayout } from './layouts/TabsLayout';

setupIonicReact();

interface GuardedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}

const PublicOnly: React.FC<GuardedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isOnboarded = useAuthStore((s) => s.isOnboarded());
  return (
    <Route
      {...rest}
      render={(props) => {
        if (isAuthenticated && isOnboarded) return <Redirect to="/app/home" />;
        if (isAuthenticated && !isOnboarded) return <Redirect to="/onboarding" />;
        return <Component {...props} />;
      }}
    />
  );
};

const RequireAuth: React.FC<GuardedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return (
    <Route
      {...rest}
      render={(props) => (isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
};

const RequireOnboarded: React.FC<GuardedRouteProps> = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isOnboarded = useAuthStore((s) => s.isOnboarded());
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!isAuthenticated) return <Redirect to="/login" />;
        if (!isOnboarded) return <Redirect to="/onboarding" />;
        return <Component {...props} />;
      }}
    />
  );
};

const Root: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const isOnboarded = useAuthStore((s) => s.isOnboarded());
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isOnboarded) return <Redirect to="/onboarding" />;
  return <Redirect to="/app/home" />;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <PublicOnly path="/login" component={Login} exact />
        <RequireAuth path="/onboarding" component={Onboarding} exact />
        <RequireOnboarded path="/app" component={TabsLayout} />
        <Route exact path="/" component={Root} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
