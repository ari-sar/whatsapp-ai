import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonMenu,
  IonMenuButton,
  useIonAlert,
} from '@ionic/react';
import { logOut, settings } from 'ionicons/icons';
import { useSettingsStore } from '../../store/useSettingsStore';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { clearCredentials } = useSettingsStore();
  const [presentAlert] = useIonAlert();

  const handleLogout = () => {
    presentAlert({
      header: 'Logout',
      message: 'Clear credentials and return to setup?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          role: 'destructive',
          handler: () => {
            clearCredentials();
            window.location.reload();
          },
        },
      ],
    });
  };

  return (
    <IonHeader>
      <IonToolbar>
        <IonMenuButton slot="start" />
        <IonTitle>{title}</IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={handleLogout}>
            <IonIcon slot="icon-only" icon={logOut} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};
