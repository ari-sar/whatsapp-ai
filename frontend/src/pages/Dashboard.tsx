import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const Dashboard: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonMenuButton slot="start" />
        <IonTitle>Dashboard</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Leads</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>View and manage incoming leads from WhatsApp conversations.</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Responses</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>Build your library of automated reply messages.</IonCardContent>
            </IonCard>
          </IonCol>
          <IonCol size="12" sizeMd="4">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Keyword Rules</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>Map trigger keywords to automated responses.</IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonContent>
  </IonPage>
);

export default Dashboard;
