import React, { Component } from "react";
import { connect } from "react-redux";
import { push } from "connected-react-router";
import { Form, Icon, Input, Button, Radio, Select, Upload, Typography, Spin, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import axios from "axios";

const { Option, OptGroup } = Select;
const { Title } = Typography;
const { TextArea } = Input;

class EmailComponent extends Component {
  constructor(props) {
    super(props);
    if (!props.user.auth) {
      props._push('/login');
    }

    this.state = {
      unfilteredRoles: [],
      unfilteredUsers: [],
      roles: [],
      users: [],
      fileList: [],
      uploading: false,
      loading: false
    }
  }

  componentDidMount = () => {
    axios.post("/message/getRoles", {"auth": this.props.user.auth})
      .then((response) => {
        this.setState({unfilteredRoles: response.data})
      }).catch((err) => {
        this.props._push('/');
      });
    axios.post("/message/getUsers", {"auth": this.props.user.auth})
      .then((response) => {
        this.setState({unfilteredUsers: response.data})
      }).catch((err) => {
        this.props._push('/');
      });
  }

  componentDidUpdate = (prevProps, prevState) => {
    if(this.state.unfilteredRoles != prevState.unfilteredRoles) {
      let roles = this.state.roles;
      for (let i in this.state.unfilteredRoles) {
        roles.push(<Option key={"r" + this.state.unfilteredRoles[i][0]} value={"r" + this.state.unfilteredRoles[i][0]} label={this.state.unfilteredRoles[i][1]}>{this.state.unfilteredRoles[i][1]}</Option>)
      }
      this.setState({ "roles": roles });
    }
    if(this.state.unfilteredUsers != prevState.unfilteredUsers) {
      let users = this.state.users;
      for(let i in this.state.unfilteredUsers) {
        users.push(<Option key={"u" + this.state.unfilteredUsers[i][0]} value={"u" + this.state.unfilteredUsers[i][0]} label={this.state.unfilteredUsers[i][1]}>{this.state.unfilteredUsers[i][1]}</Option>)
      }
      this.setState({ "users": users });
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const roles = [];
        const users = [];
        values.To.forEach((key) => {
          if (key.charAt(0) === "r") {
            roles.push(key.substring(1));
          } else {
            users.push(key.substring(1));
          }
        });
        
        const reqBody = {
          "auth": this.props.user.auth,
          "roles": roles,
          "users": users,
          "subject": values.subject,
          "message": values.body,
        }
        
        let formData = new FormData();
        formData.append('data', JSON.stringify(reqBody));
        
        if (this.state.fileList.length !== 0) {
          formData.append('file', this.state.fileList[0]);
        } 
        this.setState({loading: true})
        axios.post("/message/email", formData, {headers: {"auth": this.props.user.auth}})
          .then((response) => {
            message.success("Email sent");
            this.setState({fileList: [], loading: false})
            this.props.form.resetFields();
          }).catch((error) => {
            message.error("Email failed to send");
          });
        
      }
    });
  };

  handleFileBeforeUpload = (file) => {
    this.setState({
      fileList: [file]
    });
    return false;
  }

  handleFileRemove = (file) => {
    this.setState({ fileList: [] });
    return { fileList: [] }
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        md: { span: 24 },
        lg: { span: 2 },
      },
      wrapperCol: {
        md: { span: 24 },
        lg: { span: 22 },
      },
    };
    return (
      <div>
        <Form {...formItemLayout} onSubmit={this.handleSubmit} style={{ background: "#FFFFFF", padding: "10vh", textAlign: "center" }}>
          <Form.Item label="To">
            {getFieldDecorator('To', {
              rules: [
                {
                  required: true,
                  message: 'Please enter recipients',
                },
              ],
            })(
              <Select mode="multiple" placeholder="Recipients" optionFilterProp="label">
                <OptGroup label="Roles">
                  {this.state.roles}
                </OptGroup>
                <OptGroup label="Users">
                  {this.state.users}
                </OptGroup>
              </Select>
            )}
          </Form.Item>
          <Form.Item label="Subject">
            {getFieldDecorator('subject', {
              rules: [
                {
                  required: true,
                  message: 'Please enter a subject',
                },
              ],
            })(<Input />)}
          </Form.Item>
          <Form.Item label="Body">
            {getFieldDecorator('body', {
              rules: [
                {
                  required: true,
                  message: 'Please enter a message',
                },
              ],
            })(<TextArea
              autoSize={{ minRows: 4, maxRows: 20 }}
            />)}
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Upload onRemove={this.handleFileRemove} beforeUpload={this.handleFileBeforeUpload} fileList={this.state.fileList}>
              <Button disabled={this.state.fileList.length !== 0}>
                <CloudUploadOutlined /> Click to Upload a File
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item style={{ textAlign: "right" }}>
            <Button type="primary" htmlType="submit" loading={this.state.uploading}>Submit</Button>
            {this.state.loading ? <Spin style={{marginLeft: "10px"}}/>: ""}
          </Form.Item>
        </Form>
      </div>
    )
  }
}

const EmailForm = Form.create({ name: 'Email' })(EmailComponent);

const mapStoreToProps = state => {
  return {
    user: state.user,
    roles: state.roles,
    userList: state.userList
  };
};

const mapDispatchToProps = {
  _push: push
};

export default connect(mapStoreToProps, mapDispatchToProps)(EmailForm);
//replace null with mapStateToProps to connect to the state variables

