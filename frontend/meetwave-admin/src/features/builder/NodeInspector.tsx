import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonListHeader,
  IonNote,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { add, trash } from 'ionicons/icons';
import { Node, Edge } from '@xyflow/react';

interface Props {
  node: Node | null;
  edges: Edge[];
  onPatchData: (patch: Record<string, any>) => void;
  onRename: (newId: string) => void;
}

export const NodeInspector: React.FC<Props> = ({ node, edges, onPatchData, onRename }) => {
  if (!node) {
    return (
      <div style={{ padding: 16, color: 'var(--ion-color-medium)' }}>
        <p>Select a node to edit its config.</p>
        <p style={{ fontSize: 12 }}>Drag from the dot below a node to the dot above another node to create a transition.</p>
      </div>
    );
  }

  const d = (node.data ?? {}) as any;
  const type = d.type ?? node.type ?? 'text';
  const outgoing = edges.filter((e) => e.source === node.id);

  const updateSection = (idx: number, patch: any) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections[idx] = { ...sections[idx], ...patch };
    onPatchData({ sections });
  };
  const addSection = () => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections.push({ title: 'Section', rows: [] });
    onPatchData({ sections });
  };
  const deleteSection = (idx: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    sections.splice(idx, 1);
    onPatchData({ sections });
  };
  const updateRow = (si: number, ri: number, patch: any) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows[ri] = { ...rows[ri], ...patch };
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };
  const addRow = (si: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows.push({ id: `opt_${rows.length + 1}`, title: 'New option' });
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };
  const deleteRow = (si: number, ri: number) => {
    const sections = Array.isArray(d.sections) ? [...d.sections] : [];
    const rows = [...(sections[si]?.rows ?? [])];
    rows.splice(ri, 1);
    sections[si] = { ...sections[si], rows };
    onPatchData({ sections });
  };

  const updateButton = (idx: number, patch: any) => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    buttons[idx] = { ...buttons[idx], ...patch };
    onPatchData({ buttons });
  };
  const addButton = () => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    if (buttons.length >= 3) return;
    buttons.push({ id: `btn_${buttons.length + 1}`, title: 'Button' });
    onPatchData({ buttons });
  };
  const deleteButton = (idx: number) => {
    const buttons = Array.isArray(d.buttons) ? [...d.buttons] : [];
    buttons.splice(idx, 1);
    onPatchData({ buttons });
  };

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <IonList>
        <IonListHeader>
          <IonLabel>{type.toUpperCase()} step</IonLabel>
        </IonListHeader>
        <IonItem>
          <IonLabel position="stacked">Step ID</IonLabel>
          <IonInput
            value={node.id}
            onIonBlur={(e) => {
              const v = String((e.target as HTMLIonInputElement).value ?? '').trim();
              if (v && v !== node.id) onRename(v);
            }}
          />
          <IonNote slot="helper">Stable identifier. Changing breaks active conversations.</IonNote>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Label</IonLabel>
          <IonInput
            value={d.label ?? ''}
            onIonInput={(e) => onPatchData({ label: e.detail.value ?? '' })}
          />
        </IonItem>

        {(type === 'text' || type === 'list' || type === 'button' || type === 'end') && (
          <IonItem>
            <IonLabel position="stacked">Prompt</IonLabel>
            <IonTextarea
              autoGrow
              value={d.prompt ?? ''}
              onIonInput={(e) => onPatchData({ prompt: e.detail.value ?? '' })}
            />
            <IonNote slot="helper">Use {'{{var}}'} to interpolate collected_data.</IonNote>
          </IonItem>
        )}

        {type === 'text' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Validation regex (optional)</IonLabel>
              <IonInput
                value={d.validation ?? ''}
                onIonInput={(e) => onPatchData({ validation: e.detail.value ?? '' })}
                placeholder="^\\d{6}$"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
                placeholder="pincode"
              />
            </IonItem>
          </>
        )}

        {(type === 'text' || type === 'list' || type === 'button') && (
          <IonItem>
            <IonLabel position="stacked">Invalid message (re-prompt)</IonLabel>
            <IonTextarea
              autoGrow
              value={d.invalidMessage ?? ''}
              onIonInput={(e) => onPatchData({ invalidMessage: e.detail.value ?? '' })}
            />
          </IonItem>
        )}

        {type === 'list' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Button label</IonLabel>
              <IonInput
                value={d.buttonLabel ?? ''}
                onIonInput={(e) => onPatchData({ buttonLabel: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect option id into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Collect option label into key</IonLabel>
              <IonInput
                value={d.collectLabelKey ?? ''}
                onIonInput={(e) => onPatchData({ collectLabelKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonListHeader>
              <IonLabel>Sections</IonLabel>
              <IonButton fill="clear" size="small" onClick={addSection}>
                <IonIcon icon={add} slot="start" />
                Add section
              </IonButton>
            </IonListHeader>
            {(d.sections ?? []).map((sec: any, si: number) => (
              <div key={si} style={{ padding: '8px 16px', borderTop: '1px solid var(--ion-color-light)' }}>
                <IonItem>
                  <IonLabel position="stacked">Section title</IonLabel>
                  <IonInput
                    value={sec.title ?? ''}
                    onIonInput={(e) => updateSection(si, { title: e.detail.value ?? '' })}
                  />
                  <IonButton slot="end" fill="clear" color="danger" onClick={() => deleteSection(si)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
                {(sec.rows ?? []).map((row: any, ri: number) => (
                  <div key={ri} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                    <IonInput
                      value={row.id ?? ''}
                      placeholder="id"
                      onIonInput={(e) => updateRow(si, ri, { id: e.detail.value ?? '' })}
                    />
                    <IonInput
                      value={row.title ?? ''}
                      placeholder="title (max 24 chars)"
                      onIonInput={(e) => updateRow(si, ri, { title: e.detail.value ?? '' })}
                    />
                    <IonButton fill="clear" color="danger" onClick={() => deleteRow(si, ri)}>
                      <IonIcon icon={trash} />
                    </IonButton>
                  </div>
                ))}
                <IonButton fill="clear" size="small" onClick={() => addRow(si)}>
                  <IonIcon icon={add} slot="start" />
                  Add row
                </IonButton>
              </div>
            ))}
          </>
        )}

        {type === 'button' && (
          <>
            <IonItem>
              <IonLabel position="stacked">Collect chosen button id into key</IonLabel>
              <IonInput
                value={d.collectKey ?? ''}
                onIonInput={(e) => onPatchData({ collectKey: e.detail.value ?? '' })}
              />
            </IonItem>
            <IonListHeader>
              <IonLabel>Buttons (max 3)</IonLabel>
              <IonButton fill="clear" size="small" onClick={addButton} disabled={(d.buttons?.length ?? 0) >= 3}>
                <IonIcon icon={add} slot="start" />
                Add button
              </IonButton>
            </IonListHeader>
            {(d.buttons ?? []).map((b: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: 8, padding: '4px 16px' }}>
                <IonInput
                  value={b.id ?? ''}
                  placeholder="id"
                  onIonInput={(e) => updateButton(idx, { id: e.detail.value ?? '' })}
                />
                <IonInput
                  value={b.title ?? ''}
                  placeholder="title (max 20 chars)"
                  onIonInput={(e) => updateButton(idx, { title: e.detail.value ?? '' })}
                />
                <IonButton fill="clear" color="danger" onClick={() => deleteButton(idx)}>
                  <IonIcon icon={trash} />
                </IonButton>
              </div>
            ))}
          </>
        )}

        <IonListHeader>
          <IonLabel>Outgoing transitions</IonLabel>
        </IonListHeader>
        {outgoing.length === 0 && (
          <IonItem>
            <IonNote>None. Connect to another node on the canvas.</IonNote>
          </IonItem>
        )}
        {outgoing.map((e) => (
          <IonItem key={e.id}>
            <IonLabel>
              <p>→ {e.target}</p>
              <IonNote>{(e.data as any)?.condition ? JSON.stringify((e.data as any).condition) : 'default (unconditional)'}</IonNote>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    </div>
  );
};
