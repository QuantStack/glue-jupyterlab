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
  links: IAdvancedLinkInfo[],
  clickCallback: (link: IAdvancedLinkInfo) => void
): JSX.Element {
  return (
    <div>
      {links.map(link => (
        <div key={link.origin} className={'glue-LinkEditor-advancedLinkItem'}>
          <div style={{ fontWeight: 'bold' }}>
            {link.name.split('.')[link.name.split('.').length - 1]}
          </div>
          <table>
            <tr key={link.origin}>
              <td>
                <div>{link.data1}</div>
                <div style={{ fontStyle: 'italic' }}>
                  {link.cids1.join(', ')}
                </div>
              </td>
              <td>
                <div>{link.data2}</div>
                <div style={{ fontStyle: 'italic' }}>
                  {link.cids2.join(', ')}
                </div>
              </td>
              <td>
                <Button
                  className="glue-LinkEditor-button"
                  onClick={() => clickCallback(link)}
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
