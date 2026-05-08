import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';
import Login from '@/pages/Login';

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" component={Login} exact />
        <ProtectedRoute path="/app">
          <AppLayout />
        </ProtectedRoute>
        <Route exact path="/">
          <Redirect to="/app/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
