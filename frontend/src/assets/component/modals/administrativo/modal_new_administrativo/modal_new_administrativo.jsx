import React from 'react';
import ModalParent from "../../modal_parent/modal";
import InputText from "../../../inputText/input";
import Button from "../../../button/button";
import "./modal_new_administrativo.sass";
import FileInput from "../../../file_input/FileInput";
import Actions from "../../../../../redux/actions/actions";
import {connect} from "react-redux";
import {post} from 'axios';
import {checkIfURLIsImage} from "../../../../AuxFunctions";
import administradorDAO from "../../../../../DAO/administradorDAO";

const ModalNewAdministrativo = ({
                                    show,
                                    close,
                                    mongoClient,
                                    closeModal,
                                    administradorSelected = {},
                                    setAdministrativo,
                                    unselectAdministrativo
                                }) => {

    const [loading, setLoading] = React.useState(false);
    const [file, setFile] = React.useState(null);
    const [fileURL, setFileURL] = React.useState('');
    const [editing, setEditing] = React.useState(false);

    React.useEffect(() => {
        setEditing(false);
    }, []);

    const fileUpload = async (file) => {
        const url = 'https://teste.integracps.com.br/imageUpload.php';
        const formData = new FormData();
        formData.append('userfile', file);
        const config = {headers: {'content-type': 'multipart/form-data'}};
        return post(url, formData, config);
    }

    const newAdministrativo = async form => {
        if (checkIfURLIsImage(fileURL)) {
            try {
                await fileUpload(file);
                await administradorDAO.addUser(mongoClient, form.email.value, form.senha.value, {
                    nome: form.nome.value,
                    foto_url: fileURL,
                    email: form.email.value,
                });
                checkIfURLIsImage(fileURL);
                alert('Administrador adicionado com Sucesso!');
                closeModal();
            } catch (err) {
                alert(err);
            }
        }
    };

    const editAdministrativo = async form => {
        try {
            await administradorDAO.update({_id: administradorSelected._id}, {
                nome: form.nome.value,
                email: form.email.value,
            });
            const adms = await administradorDAO.findAll();
            setAdministrativo(adms);
            alert('Administrador editado com Sucesso!');
            closeModal();
        } catch (err) {
            alert(err);
        }
    }

    const removeAdministrativo = async () => {
        try {
            await administradorDAO.delete({_id: administradorSelected._id});
            const adms = await administradorDAO.findAll();
            setAdministrativo(adms);
            alert('Administrador deletado com Sucesso!');
        } catch (err) {
            alert(err);
        }
    }

    const onSubmit = async e => {
        const form = e.target;
        e.preventDefault();
        setLoading(true);
        if (!editing) {
            await newAdministrativo(form);
        } else {
            await editAdministrativo(form);
        }
        unselectAdministrativo();
        setEditing(false);
        setLoading(false);
    }

    return (
        <ModalParent
            onSubmit={onSubmit}
            show={show}
            header={<header>
                <div>
                    <h1>{'nome' in administradorSelected ? 'Informações do Administrador' : 'Adicionar Administrativo'}</h1>
                </div>
                <div className={'close_container'} onClick={() => {
                    close();
                    setEditing(false);
                    unselectAdministrativo();
                }}>
                    <i className={'fa fa-times'}/>
                </div>
            </header>}
            body={<div>
                <FileInput
                    onChangeFile={(file, url) => {
                        setFile(file);
                        setFileURL(url);
                    }}
                    urlName={'foto_url'}
                    fileName={'userfile'}/>
                <InputText
                    defaultValue={administradorSelected.nome}
                    disabled={'nome' in administradorSelected && !editing}
                    label={'Nome'}
                    name={'nome'}/>
                <InputText
                    defaultValue={administradorSelected.email}
                    disabled={'nome' in administradorSelected && !editing}
                    label={'Login'}
                    name={'email'}/>
                {
                    'email' in administradorSelected ? <></> :
                        (
                            <div className={'flex'}>
                                <InputText label={'Senha'} name={'senha'}/>
                                <InputText label={'Confirmar Senha'}/>
                            </div>)
                }

            </div>}
            footer={
                <div className={'footer'}>
                    {'nome' in administradorSelected ?
                        <div className={'flex crud_ops'}>
                            <Button text={'Remover'} type={'button'} onClick={async () => {
                            if (window.confirm("Tem certeza que deseja apagar esse administrador do sistema?")) {
                                await removeAdministrativo();
                                closeModal();
                                setEditing(false);
                            }
                        }}/>
                            <Button editing={editing}
                                    onClick={() => setEditing(true)}
                                    text={'Editar'}
                                    type={'button'}/>
                        </div> : <></>}
                    <Button loading={loading} type={'submit'} text={'Confirmar'}/>
                </div>}/>
    );
}

const mapStateToProps = state => ({
    mongoClient: state.general.mongoClient,
    administradorSelected: state.administradores.administradorSelected,
});

const mapDispatchToProps = dispatch => ({
    setAdministrativo: adms => dispatch({type: Actions.setAdministrativo, payload: adms}),
    closeModal: () => dispatch({type: Actions.closeModal}),
    unselectAdministrativo: () => dispatch({type: Actions.selectAdministrador, payload: {}})
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalNewAdministrativo)