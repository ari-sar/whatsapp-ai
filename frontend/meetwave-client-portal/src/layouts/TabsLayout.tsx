import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { home, chatbubbles, people, settings, locationOutline } from 'ionicons/icons';
import { Home } from '../pages/Home';
import { Keywords } from '../pages/Keywords';
import { Leads } from '../pages/Leads';
import { Settings as SettingsPage } from '../pages/Settings';
import { MyFlow } from '../pages/MyFlow';
import { ServiceAreas } from '../pages/ServiceAreas';

export const TabsLayout: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route path="/app/home" component={Home} exact />
      <Route path="/app/keywords" component={Keywords} exact />
      <Route path="/app/leads" component={Leads} exact />
      <Route path="/app/areas" component={ServiceAreas} exact />
      <Route path="/app/settings" component={SettingsPage} exact />
      <Route path="/app/flow" component={MyFlow} exact />
      <Route exact path="/app">
        <Redirect to="/app/home" />
      </Route>
    </IonRouterOutlet>
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/app/home">
        <IonIcon icon={home} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="keywords" href="/app/keywords">
        <IonIcon icon={chatbubbles} />
        <IonLabel>Keywords</IonLabel>
      </IonTabButton>
      <IonTabButton tab="areas" href="/app/areas">
        <IonIcon icon={locationOutline} />
        <IonLabel>Areas</IonLabel>
      </IonTabButton>
      <IonTabButton tab="leads" href="/app/leads">
        <IonIcon icon={people} />
        <IonLabel>Leads</IonLabel>
      </IonTabButton>
      <IonTabButton tab="settings" href="/app/settings">
        <IonIcon icon={settings} />
        <IonLabel>Settings</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);
