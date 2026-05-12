import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { gitNetwork, people, card, settings } from 'ionicons/icons';
import { Flows } from '../pages/Flows';
import { Users } from '../pages/Users';
import { Plans } from '../pages/Plans';
import { Settings as SettingsPage } from '../pages/Settings';

export const TabsLayout: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route path="/app/flows" component={Flows} exact />
      <Route path="/app/users" component={Users} exact />
      <Route path="/app/plans" component={Plans} exact />
      <Route path="/app/settings" component={SettingsPage} exact />
      <Route exact path="/app">
        <Redirect to="/app/flows" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="flows" href="/app/flows">
        <IonIcon icon={gitNetwork} />
        <IonLabel>Flow</IonLabel>
      </IonTabButton>
      <IonTabButton tab="users" href="/app/users">
        <IonIcon icon={people} />
        <IonLabel>Users</IonLabel>
      </IonTabButton>
      <IonTabButton tab="plans" href="/app/plans">
        <IonIcon icon={card} />
        <IonLabel>Plans</IonLabel>
      </IonTabButton>
      <IonTabButton tab="settings" href="/app/settings">
        <IonIcon icon={settings} />
        <IonLabel>Settings</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);
