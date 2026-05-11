import {
  IonApp,
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonMenuToggle,
  IonRouterOutlet,
  IonIcon,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import {
  createOutline,
  peopleOutline,
  settingsOutline,
} from 'ionicons/icons';

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

import { useSettingsStore } from './store/useSettingsStore';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { FlowCanvas } from './features/builder/FlowCanvas';
import { LeadsTable } from './features/crm/LeadsTable';

setupIonicReact();

const navItems = [
  { label: 'Builder', path: '/builder', icon: createOutline },
  { label: 'Leads', path: '/leads', icon: peopleOutline },
  { label: 'Settings', path: '/settings', icon: settingsOutline },
];

const Sidebar: React.FC = () => (
  <IonMenu contentId="main-content" type="overlay">
    <IonContent>
      <div style={{ padding: '16px', fontWeight: 700, fontSize: 18, color: 'var(--ion-color-primary)' }}>
        Meetwave
      </div>
      <IonList lines="none">
        {navItems.map((item) => (
          <IonMenuToggle key={item.path} autoHide={false}>
            <IonItem routerLink={item.path} routerDirection="none" detail={false}>
              <IonIcon slot="start" icon={item.icon} />
              <IonLabel>{item.label}</IonLabel>
            </IonItem>
          </IonMenuToggle>
        ))}
      </IonList>
    </IonContent>
  </IonMenu>
);

const App: React.FC = () => {
  const isConfigured = useSettingsStore((s) => s.isConfigured());

  if (!isConfigured) {
    return (
      <IonApp>
        <OnboardingScreen />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <Sidebar />
        <IonRouterOutlet id="main-content">
          <Route path="/builder" component={FlowCanvas} exact />
          <Route path="/leads" component={LeadsTable} exact />
          <Route path="/settings" render={() => <div>Settings Page (TODO)</div>} exact />
          <Route exact path="/">
            <Redirect to="/builder" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
