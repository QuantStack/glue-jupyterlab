import { Button, deleteIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { IRelatedLink } from '../types';

/**
 * A React widget with the identity links.
 *
 * @param links - List of links to display.
 * @param clickCallback - Function to call when clicking on the delete icon.
 */
export function identityLinks(
  links: IRelatedLink[],
  clickCallback: (link: IRelatedLink) => void
): JSX.Element {
  return (
    <table style={{ width: '100%' }}>
      {links.map(link => (
        <tr>
          <td>{link.src?.attribute}</td>
          <td>{link.dest?.attribute}</td>
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
      ))}
    </table>
  );
}
