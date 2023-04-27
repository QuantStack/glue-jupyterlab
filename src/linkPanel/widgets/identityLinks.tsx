import { Button, deleteIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { IComponentLinkInfo } from '../types';

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
          <td>{link[1] ? link[0].dest?.label : link[0].src?.label}</td>
          <td>{link[1] ? link[0].src?.label : link[0].dest?.label}</td>
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
