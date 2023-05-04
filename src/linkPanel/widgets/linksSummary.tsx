import { Button, deleteIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { IAdvancedLinkInfo, IComponentLinkInfo } from '../types';

/**
 * A React widget with the identity links.
 *
 * @param links - List of links to display.
 * @param clickCallback - Function to call when clicking on the delete icon.
 */
export function identityLinks(
  links: [IComponentLinkInfo, boolean][],
  clickCallback: (link: IComponentLinkInfo) => void
): JSX.Element {
  return (
    <table>
      {links.map(link => (
        <tr key={link[0].origin}>
          <td>{link[1] ? link[0].dest.label : link[0].src.label}</td>
          <td>{link[1] ? link[0].src.label : link[0].dest.label}</td>
          <td>
            <Button
              className="glue-LinkEditor-button"
              onClick={() => clickCallback(link[0])}
              minimal
            >
              <LabIcon.resolveReact
                icon={deleteIcon}
                height={'24px'}
                width={'24px'}
              />
            </Button>
          </td>
        </tr>
      ))}
    </table>
  );
}

/**
 * A React widget with the advanced links.
 *
 * @param links - List of links to display.
 * @param clickCallback - Function to call when clicking on the delete icon.
 */
export function advancedLinks(
  links: [IAdvancedLinkInfo, boolean][],
  clickCallback: (link: IAdvancedLinkInfo) => void
): JSX.Element {
  return (
    <div>
      {links.map(link => (
        <div
          key={link[0].origin}
          className={'glue-LinkEditor-advancedLinkItem'}
        >
          <div style={{ fontWeight: 'bold' }}>
            {link[0].name.split('.')[link[0].name.split('.').length - 1]}
          </div>
          <table>
            <tr key={link[0].origin}>
              <td>
                <span style={{ fontWeight: 'bold' }}>{link[0].data1}</span>
                <span> ({link[0].cids1.join(', ')})</span>
              </td>
              <td>
                <span style={{ fontWeight: 'bold' }}>{link[0].data2}</span>
                <span> ({link[0].cids2.join(', ')})</span>
              </td>
              <td>
                <Button
                  className="glue-LinkEditor-button"
                  onClick={() => clickCallback(link[0])}
                  minimal
                >
                  <LabIcon.resolveReact
                    icon={deleteIcon}
                    height={'24px'}
                    width={'24px'}
                  />
                </Button>
              </td>
            </tr>
          </table>
        </div>
      ))}
    </div>
  );
}
