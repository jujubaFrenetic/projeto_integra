import React from 'react';
import PropTypes from 'prop-types';
import './styles.sass';
import Button from '../../../button/button';
import ModalParent from '../../modal_parent/modal';
import Options from './tipos/options';
import { connect } from 'react-redux';
import Moment from 'moment/min/moment-with-locales';
import { extendMoment } from 'moment-range';
import reservaDAO from '../../../../../DAO/reservaDAO';
import Actions from '../../../../../redux/actions/actions';
import logDAO from '../../../../../DAO/logDAO';

const moment = extendMoment(Moment);

const ModalAgendamento = ({
  show,
  close,
  dateSelected,
  userLogged,
  salaSelected,
  profissionalReservas,
  salaBloqueios,
  setAgendamentos,
  mongoClient,
  agendamentos,
  setProfissionalReservas,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [selectedPage, selectPage] = React.useState('Hora Avulsa');
  const [selectedTurno, selectTurno] = React.useState({});
  const [selectedMes, selectMes] = React.useState(null);

  const checkIfIsBetween = (
    actualDateBegin,
    actualDateEnds,
    dateOne,
    dateTwo
  ) => {
    let one = moment.range(actualDateBegin, actualDateEnds);
    let two = moment.range(dateOne, dateTwo);
    return one.overlaps(two);
  };

  const OverlappingRanges = (r1_start, r1_finish, r2_start, r2_finish) => {
    let [arr1, arr2] = [[], []];
    for (let i = r1_start; i < r1_finish; i++) {
      arr1.push(i);
    }
    for (let i = r2_start; i < r2_finish; i++) {
      arr2.push(+i);
    }
    for (let el of arr1) {
      if (arr2.includes(el)) {
        return true;
      }
    }
    return false;
  };

  const checkIfBlocked = () => {
    let bloqueios = [];
    if (Array.isArray(salaBloqueios) && salaSelected) {
      for (let bloqueio of salaBloqueios) {
        if (bloqueio.sala && salaSelected._id) {
          if (
            bloqueio.sala.toString() === salaSelected._id.toString() &&
            moment(new Date(bloqueio.dia))
              .add(1, 'day')
              .isSame(dateSelected, 'day')
          )
            bloqueios.push(bloqueio);
        }
      }
    }
    return bloqueios.length > 0 ? bloqueios : null;
  };

  const prepareData = (form) => {
    let data = {
      profissional_id: userLogged._id,
      sala_id: salaSelected._id,
      data: dateSelected,
      cancelado: false,
      pago: false,
      executado: false,
    };
    switch (selectedPage) {
      case 'Hora Avulsa':
        return {
          ...data,
          hora_inicio: Number(form.hora_inicio.value),
          hora_fim: Number(form.hora_fim.value),
          valorTotal: Number(
            (
              salaSelected.valor_hora *
              (Number(form.hora_fim.value) - Number(form.hora_inicio.value))
            ).toFixed(2)
          ),
        };
      case 'Turno':
        return {
          ...data,
          ...selectedTurno,
          valorTotal:
            salaSelected.valor_hora *
            (selectedTurno.hora_fim - selectedTurno.hora_inicio),
        };
      case 'Mensal':
        return {
          ...data,
          mes: selectedMes,
          valorTotal: 3500,
        };
      default:
        return null;
    }
  };

  const getStringDate = (date, hour) =>
    `${moment(date).format('yyyy-MM-DD')} ${hour}:00`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    setLoading(true);
    let data = prepareData(form);
    let agendamentosSala = reservaDAO.getAgendamentosFromSala(
      agendamentos,
      salaSelected
    );
    let agendamentosDia = agendamentosSala.filter(
      (agendamento) =>
        moment(agendamento.data).isSame(dateSelected, 'day') &&
        !agendamento.cancelado
    );
    if (selectedPage === 'Hora Avulsa') {
      await reservaDAO.createHoraAvulsa(
        data,
        agendamentosDia,
        dateSelected,
        async () => {
          /* Checa se o Usuário não tem uma reserva igual em outra sala */
          /* Reserva igual: Overlaps horário e dia, e diferente sala */
          let actualDateBegin = new Date(
            getStringDate(data.data, data.hora_inicio)
          );
          let actualDateEnd = new Date(getStringDate(data.data, data.hora_fim));
          for (let reserva of profissionalReservas) {
            let thisDateBegin = new Date(
              getStringDate(reserva.data, reserva.hora_inicio)
            );
            let thisDateEnd = new Date(
              getStringDate(reserva.data, reserva.hora_fim)
            );
            if (
              moment(data.data).isSame(new Date(reserva.data), 'day') &&
              !reserva.cancelado &&
              checkIfIsBetween(
                actualDateBegin,
                actualDateEnd,
                thisDateBegin,
                thisDateEnd
              )
            ) {
              alert(
                'O horário selecionado já se encontra reservado ' +
                  'por você em outra sala. Por favor, cancele a anterior para fazer ' +
                  'esse agendamento.'
              );
              setLoading(false);
              return;
            }
          }

          const bloqueios = checkIfBlocked();
          if (bloqueios) {
            for (let bloqueio of bloqueios) {
              if (
                OverlappingRanges(
                  data.hora_inicio,
                  data.hora_fim,
                  bloqueio.horaInicio,
                  bloqueio.horaFim
                )
              ) {
                console.log(
                  [data.hora_inicio, data.hora_fim],
                  [bloqueio.horaInicio, bloqueio.horaFim]
                );
                alert(
                  'O horário se encontra indisponível pois a sala está bloqueada nesse horário.'
                );
                setLoading(false);
                return;
              }
            }
          }
          try {
            await logDAO.create({
              usuario: userLogged,
              log: `Nova reserva ${userLogged.nome} ${moment(
                dateSelected
              ).format('DD-MM-YYYY')} ${data.hora_inicio}h-${data.hora_fim}h ${
                salaSelected.nome
              }`,
              data_hora: new Date(),
            });
            await reservaDAO.create(data, userLogged);
            let novasReservas = await reservaDAO.findThisMonth(mongoClient);
            setProfissionalReservas(
              reservaDAO.findReservaDeCliente(userLogged._id, novasReservas)
            );
            setAgendamentos(novasReservas);
            setLoading(false);
            alert('Adicionado com sucesso!');
            close();
          } catch (e) {
            alert(e);
            setLoading(false);
          }
        },
        () => {
          alert(
            'Erro! O horário já se encontra reservado ou horário inválido.'
          );
          setLoading(false);
          close();
        }
      );
    } else if (selectedPage === 'Turno') {
      let dateBegin = new Date(
        getStringDate(dateSelected, selectedTurno.hora_inicio)
      );
      let dateFim = new Date(
        getStringDate(dateSelected, selectedTurno.hora_fim)
      );
      let passed = true;
      for (let agendamento of agendamentos) {
        // Checagem de ERRO para AGENDAMENTO DE TURNO.
        let dateInicioAgendamento = new Date(
            getStringDate(new Date(agendamento.data), agendamento.hora_inicio)
          ),
          dateFimAgendamento = new Date(
            getStringDate(new Date(agendamento.data), agendamento.hora_fim)
          );

        if (
          checkIfIsBetween(
            dateBegin,
            dateFim,
            dateInicioAgendamento,
            dateFimAgendamento
          )
        ) {
          alert('Erro! O horário já se encontra reservado.');
          passed = false;
          setLoading(false);
          close();
          break;
        }
      }
      if (passed) {
        await reservaDAO.create(data, userLogged);
        let novasReservas = await reservaDAO.findAll(mongoClient);
        setProfissionalReservas(
          reservaDAO.findReservaDeCliente(userLogged._id, novasReservas)
        );
        setAgendamentos(novasReservas);
        setLoading(false);
        alert('Adicionado com sucesso!');
        close();
      }
    } else {
      await reservaDAO.create(data, userLogged);
      let novasReservas = await reservaDAO.findAll(mongoClient);
      setAgendamentos(novasReservas);
      setLoading(false);
      alert('Adicionado com sucesso!');
      close();
    }
  };

  return (
    <ModalParent
      show={show}
      onSubmit={handleSubmit}
      header={
        <header>
          <div>
            <h1>Adicionar Reserva</h1>
            <h3>
              {moment(dateSelected)
                .locale('pt-BR')
                .format('DD [de] MMMM [de] YYYY')}{' '}
              - {salaSelected.nome}
            </h3>
          </div>
          <div className={'close_container'} onClick={close}>
            <i className={'fa fa-times'} />
          </div>
        </header>
      }
      body={
        <div>
          <Options
            selectedPage={selectedPage}
            selectPage={selectPage}
            selectMes={selectMes}
            selectTurno={selectTurno}
          />
        </div>
      }
      footer={
        <div className={'footer'}>
          <Button loading={loading} type={'submit'} text={'Confirmar'} />
        </div>
      }
    />
  );
};
ModalAgendamento.propTypes = {
  show: PropTypes.bool.isRequired,
  close: PropTypes.func,
};

const mapStateToProps = (state) => ({
  dateSelected: state.general.dateSelected,
  salaSelected: state.salas.salaSelected,
  userLogged: state.general.userLogged,
  profissionalReservas: state.profissionais.profissionalReservas,
  mongoClient: state.general.mongoClient,
  salaBloqueios: state.salas.bloqueiosSalas,
  agendamentos: state.agendamentos.agendamentos,
});

const mapDispatchToProps = (dispatch) => ({
  setProfissionalReservas: (reservas) =>
    dispatch({ type: Actions.setProfissionalReservas, payload: reservas }),
  setAgendamentos: (agendamentos) =>
    dispatch({ type: Actions.setAgendamentos, payload: agendamentos }),
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalAgendamento);
