import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonSplitPane,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  analyticsOutline,
  chatbubblesOutline,
  keyOutline,
  peopleOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Redirect, Route, useLocation } from 'react-router-dom';

import Dashboard from '@/pages/Dashboard';
import Keywords from '@/pages/Keywords';
import Leads from '@/pages/Leads';
import Responses from '@/pages/Responses';
import Settings from '@/pages/Settings';

const navItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: analyticsOutline },
  { label: 'Leads', path: '/app/leads', icon: peopleOutline },
  { label: 'Responses', path: '/app/responses', icon: chatbubblesOutline },
  { label: 'Keywords', path: '/app/keywords', icon: keyOutline },
  { label: 'Settings', path: '/app/settings', icon: settingsOutline },
];

const SidebarMenu: React.FC = () => {
  const location = useLocation();

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonContent>
        <div style={{ padding: '24px 16px 8px', fontWeight: 700, fontSize: 18 }}>
          WhatsApp AI
        </div>
        <IonList lines="none">
          {navItems.map((item) => (
            <IonMenuToggle key={item.path} autoHide={false}>
              <IonItem
                routerLink={item.path}
                routerDirection="none"
                detail={false}
                color={location.pathname === item.path ? 'primary' : undefined}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{item.label}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

const AppLayout: React.FC = () => (
  <IonSplitPane contentId="main-content" when="md">
    <SidebarMenu />
    <IonPage id="main-content">
      <IonTabs>
        <IonRouterOutlet>
          <Route path="/app/dashboard" component={Dashboard} exact />
          <Route path="/app/leads" component={Leads} exact />
          <Route path="/app/responses" component={Responses} exact />
          <Route path="/app/keywords" component={Keywords} exact />
          <Route path="/app/settings" component={Settings} exact />
          <Route exact path="/app">
            <Redirect to="/app/dashboard" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom" className="ion-hide-md-up">
          {navItems.map((item) => (
            <IonTabButton key={item.path} tab={item.label} href={item.path}>
              <IonIcon icon={item.icon} />
              <IonLabel>{item.label}</IonLabel>
            </IonTabButton>
          ))}
        </IonTabBar>
      </IonTabs>
    </IonPage>
  </IonSplitPane>
);

export default AppLayout;
