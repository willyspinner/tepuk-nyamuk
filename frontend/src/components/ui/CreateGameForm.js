import {Form, Icon, Input, Button} from 'antd';
import React from 'react';


class NormalLoginForm extends React.Component {
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.onGameFormSubmit(values);
                console.log('Received values of form: ', values);
            }
        });
    };

    render() {
        const {getFieldDecorator} = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit} className="login-form" style={{marginTop:"12px"}}>
                <Form.Item>
                    {getFieldDecorator('name', {
                        rules: [{required: true, message: 'Please input your GameRoom name!'}],
                    })(
                        <Input prefix={<Icon type="smile-o" style={{color: 'rgba(0,0,0,.25)'}}/>} placeholder="Gameroom name"/>
                    )}
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Create Game
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const CreateGameForm = Form.create()(NormalLoginForm);
export default CreateGameForm;

