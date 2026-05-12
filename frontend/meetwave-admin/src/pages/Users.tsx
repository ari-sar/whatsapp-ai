import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonChip,
} from '@ionic/react';
import { AdminUser, UserFilter, listUsers } from '../api/usersService';

export const Users: React.FC = () => {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (f: UserFilter) => {
    setLoading(true);
    try {
      setUsers(await listUsers(f));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Users</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as UserFilter)}>
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="no_plan">
              <IonLabel>No plan</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="expired">
              <IonLabel>Expired</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="inactive">
              <IonLabel>Inactive</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ion-color-medium)' }}>
            No users match this filter.
          </div>
        ) : (
          <IonList>
            {users.map((u) => (
              <IonItem key={u.id}>
                <IonLabel>
                  <h2>{u.name ?? 'Unnamed'}</h2>
                  <p>+91 {u.phone} {u.businessName ? `· ${u.businessName}` : ''}</p>
                  <IonNote>
                    {u.planName ? (
                      <>
                        Plan: <strong>{u.planName}</strong>
                        {u.planExpiresAt && (
                          <> · expires {new Date(u.planExpiresAt).toLocaleDateString()}</>
                        )}
                      </>
                    ) : (
                      'No plan'
                    )}
                  </IonNote>
                </IonLabel>
                {!u.hasPlan && (
                  <IonChip slot="end" color="medium" outline>
                    No plan
                  </IonChip>
                )}
                {u.isExpired && (
                  <IonChip slot="end" color="danger" outline>
                    Expired
                  </IonChip>
                )}
                {u.hasPlan && !u.isExpired && (
                  <IonChip slot="end" color="success" outline>
                    Active
                  </IonChip>
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};
