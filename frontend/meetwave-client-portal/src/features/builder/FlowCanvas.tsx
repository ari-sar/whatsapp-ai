import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
  Node,
} from '@xyflow/react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  useIonAlert,
  IonIcon,
} from '@ionic/react';
import { trash, save } from 'ionicons/icons';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes/nodeTypes';
import { useFlowBuilder } from './hooks/useFlowBuilder';

export const FlowCanvas: React.FC<{ onSave?: (flow: any) => void }> = ({ onSave }) => {
  const builder = useFlowBuilder();
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    if (builder.nodes.length === 0) {
      const startNode: Node = {
        id: 'start-node',
        type: 'start',
        data: { type: 'start', label: 'Start' },
        position: { x: 100, y: 100 },
      };
      builder.handleNodesChange([startNode]);
    }
  }, [builder.nodes.length]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      builder.handleNodesChange(applyNodeChanges(changes, builder.nodes));
    },
    [builder.nodes, builder.handleNodesChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      builder.handleEdgesChange(applyEdgeChanges(changes, builder.edges));
    },
    [builder.edges, builder.handleEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      builder.handleEdgesChange(addEdge(connection, builder.edges));
    },
    [builder.edges, builder.handleEdgesChange]
  );

  const handleAddNode = (type: string) => {
    builder.addNewNode(type);
  };

  const handleDeleteSelected = () => {
    if (!builder.selectedNodeId) return;
    if (builder.selectedNodeId === 'start-node') {
      presentAlert({ header: 'Cannot delete', message: 'The start node is required.', buttons: ['OK'] });
      return;
    }
    presentAlert({
      header: 'Delete Node',
      message: 'Remove this step?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => builder.deleteNode(builder.selectedNodeId!),
        },
      ],
    });
  };

  const handleSave = async () => {
    const result = await builder.saveFlow();
    if (result.success && onSave) {
      onSave(result.flow);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flow Builder</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #ccc', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <IonSelect
              interfaceOptions={{ header: 'Add Node' }}
              placeholder="Add step"
              value=""
              onIonChange={(e) => {
                if (e.detail.value) {
                  handleAddNode(e.detail.value);
                  (e.target as HTMLIonSelectElement).value = '';
                }
              }}
            >
              <IonSelectOption value="text">Text Input</IonSelectOption>
              <IonSelectOption value="list">List Menu</IonSelectOption>
              <IonSelectOption value="button">Button Choice</IonSelectOption>
              <IonSelectOption value="condition">Condition</IonSelectOption>
            </IonSelect>
            <IonButton
              fill="clear"
              color="danger"
              onClick={handleDeleteSelected}
              disabled={!builder.selectedNodeId}
            >
              <IonIcon slot="start" icon={trash} /> Delete
            </IonButton>
            <IonButton fill="solid" onClick={handleSave}>
              <IonIcon slot="start" icon={save} /> Save
            </IonButton>
          </div>

          {builder.error && (
            <div style={{ padding: '8px', backgroundColor: '#ffe0e0', color: '#d00', fontSize: '12px' }}>
              {builder.error}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={builder.nodes}
              edges={builder.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => builder.setSelectedNodeId(node.id)}
              onPaneClick={() => builder.setSelectedNodeId(null)}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>
      </IonContent>
    </>
  );
};
