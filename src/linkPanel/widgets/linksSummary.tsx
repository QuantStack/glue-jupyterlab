import { Button, deleteIcon, LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { ILink } from '../types';

/**
 * A React widget with the identity links.
 *
 * @param links - List of links to display.
 * @param clickCallback - Function to call when clicking on the delete icon.
 */
export function identityLinks(
  links: LinksSummary.IIdentityLink[],
  clickCallback: (linkName: string) => void
): JSX.Element {
  return (
    <table>
      {links.map(link => (
        <tr key={link.name}>
          <td>
            {link.revert
              ? link.value.cids2_labels[0]
              : link.value.cids1_labels[0]}
          </td>
          <td>
            {link.revert
              ? link.value.cids1_labels[0]
              : link.value.cids2_labels[0]}
          </td>
          <td>
            <Button
              className="glue-LinkEditor-button"
              onClick={() => clickCallback(link.name)}
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
  links: LinksSummary.IAdvancedLink[],
  clickCallback: (linkName: string) => void
): JSX.Element {
  return (
    <div>
      {links.map(link => (
        <div key={link.name} className={'glue-LinkEditor-advancedLinkItem'}>
          <div style={{ fontWeight: 'bold' }}>
            {link.name.split('.')[link.name.split('.').length - 1]}
          </div>
          <table>
            <tr key={link.name}>
              <td>
                <div>{link.value.data1}</div>
                <div style={{ fontStyle: 'italic' }}>
                  {link.value.cids1_labels.join(', ')}
                </div>
              </td>
              <td>
                <div>{link.value.data2}</div>
                <div style={{ fontStyle: 'italic' }}>
                  {link.value.cids2_labels.join(', ')}
                </div>
              </td>
              <td>
                <Button
                  className="glue-LinkEditor-button"
                  onClick={() => clickCallback(link.name)}
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

/**
 * The LinksSummary namespace.
 */
export namespace LinksSummary {
  /**
   * The advanced link description.
   */
  export interface IAdvancedLink {
    name: string;
    value: ILink;
  }

  /**
   * The identity link description.
   */
  export interface IIdentityLink {
    name: string;
    value: ILink;
    revert: boolean;
  }
}
