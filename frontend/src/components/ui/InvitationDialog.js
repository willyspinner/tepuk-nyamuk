import React from 'react';
import {ModalContainer, ModalDialog} from 'react-modal-dialog';
import {Button} from 'antd';
/*
props:
isShowingModal: bool
invitation: object.
handleAcceptInvitation: callback
handleDeclineInvitation: callback
 */
class InvitationDialog extends React.Component {

    render() {
        return <div>
            {
                this.props.isShowingModal &&
                <ModalContainer onClose={this.props.handleDeclineInvitation}>
                    <ModalDialog onClose={this.props.handleDeclineInvitation}>
                        <h1>You've been invited by {this.props.invitation.invitedBy}!</h1>
                        <p>Please confirm if you'd like to join game {this.props.invitation.gamename}.</p>
                        <div style={{display:'flex', flexDirection:'row',justifyContent:'center'}}>
                            <Button onClick={this.props.handleAcceptInvitation} type="primary">
                                Accept
                            </Button>
                            <Button type='danger' onClick={this.props.handleDeclineInvitation}>
                                Decline
                            </Button>
                        </div>
                    </ModalDialog>
                </ModalContainer>
            }
        </div>;
    }
}
export default InvitationDialog;
