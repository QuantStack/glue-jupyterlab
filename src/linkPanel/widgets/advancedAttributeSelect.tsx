import React from 'react';
import { IGlueSessionSharedModel } from '../../types';
import { IAdvLinkDescription } from '../types';

/**
 * A React widget with the identity links.
 *
 * @param links - List of links to display.
 * @param clickCallback - Function to call when clicking on the delete icon.
 */
export function advancedAttributes(
  info: IAdvLinkDescription,
  currentDataset: [string, string],
  sharedModel: IGlueSessionSharedModel
): JSX.Element {
  const labels: ('labels1' | 'labels2')[] = ['labels1', 'labels2'];

  return (
    <div>
      <div className={'advanced-link-description'}>{info.description}</div>
      {currentDataset.map((dataset, index) => (
        <div>
          <h3>{dataset} attributes</h3>
          <table className={'advanced-link-attributes'}>
            {info[labels[index]].map(label => (
              <tr>
                <td>{label}</td>
                <td>
                  <select>
                    {sharedModel.dataset[dataset].primary_owner.map(
                      attribute => (
                        <option key={attribute} value={attribute}>
                          {attribute}
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </table>
        </div>
      ))}
    </div>
  );
}
