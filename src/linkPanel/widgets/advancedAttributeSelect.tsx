import React from 'react';
import { IGlueSessionSharedModel } from '../../types';
import { IAdvLinkDescription } from '../types';

/**
 * A React widget with the advanced link attributes.
 *
 * @param info - Information to create an advanced link.
 * @param currentDatasets - The current selected datasets.
 * @param sharedModel - The Glue session model.
 */
export function advancedAttributes(
  info: IAdvLinkDescription,
  currentDatasets: [string, string],
  sharedModel: IGlueSessionSharedModel
): JSX.Element {
  const attrType = ['input', 'output'];
  const labels: ('labels1' | 'labels2')[] = ['labels1', 'labels2'];

  return (
    <div>
      <div
        className={'advanced-link-description'}
        style={{ fontStyle: 'italic' }}
      >
        {info.description}
      </div>
      {currentDatasets.map((dataset, index) => (
        <div key={attrType[index]}>
          <div style={{ padding: '0.5em 0px' }}>
            <span style={{ fontWeight: 'bold' }}>{dataset}</span>
            <span>{` attributes (${attrType[index]}):`}</span>
          </div>
          <table className={'advanced-link-attributes'}>
            {info[labels[index]].map(label => (
              <tr key={`${attrType[index]} - ${label}`}>
                <td>{label}</td>
                <td>
                  <select>
                    {sharedModel.dataset[dataset].primary_owner.map(
                      attribute => (
                        <option key={attribute} value={attribute}>
                          {sharedModel.attributes[attribute].label}
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
