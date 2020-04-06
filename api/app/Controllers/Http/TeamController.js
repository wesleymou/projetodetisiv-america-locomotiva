'use strict'
const AdonisType = require('../../../types')

/** @typedef {typeof AdonisType.Http.Request} Request */
/** @typedef {typeof AdonisType.Http.Response} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

/** @type {typeof import('../../Models/Team')} */
const Team = use('App/Models/Team')

/** @type {typeof import('../../Models/UserRole')} */
const UserRole = use('App/Models/UserRole')

const { validate } = use('Validator')

/**
 * Resourceful controller for interacting with teams
 */
class TeamController {
  /**
   * Show a list of all teams.
   * GET teams
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async index({ request, response, view }) {
    const teams = await Team.all()
    if (teams) return response.json(teams.toJSON())
    else return response.notFound()
  }

  /**
   * Create/save a new team.
   * POST teams
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({ request, response }) {
    const data = request.only(['name', 'description'])

    const rules = {
      name: 'required|string',
      description: 'required|string',
    }

    const validation = await validate(request.all(), rules)

    if (validation.fails()) return response.unprocessableEntity()

    const team = await Team.create(data)

    response.json(team.toJSON())
    return response.created()
  }

  /**
   * Display a single team.
   * GET teams/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({ params, request, response }) {
    const { id } = params

    const rules = {
      id: 'required|integer',
    }

    const validation = await validate(params, rules)

    if (validation.fails()) return response.unprocessableEntity()

    const team = await Team.query()
      .with('groups', builder => {
        builder.with('permissions')
        builder.with('users')
      })
      .where('id', id)
      .first()

    if (team) {
      return response.json(team)
    } else {
      return response.notFound()
    }
  }

  /**
   * Update team details.
   * PUT or PATCH teams/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({ params, request, response }) {
    const { id } = params
    const data = request.only(['name', 'description'])

    const rules = {
      id: 'required|integer',
      name: 'required|string',
      description: 'required|string',
    }

    const validation = await validate({ id: id, ...data }, rules)

    if (validation.fails()) return response.unprocessableEntity()

    const team = await Team.find(id)

    if (team) {
      team.merge(data)
      await team.save()
      response.json(team.toJSON())
      response.ok()
      return
    } else return response.notFound()
  }

  /**
   * Delete a team with id.
   * DELETE teams/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({ params, request, response }) {
    const { id } = params

    const rules = {
      id: 'required|integer',
    }

    const validation = await validate(params, rules)

    if (validation.fails()) return response.unprocessableEntity()

    const team = await Team.find(id)

    if (team) {
      await team.delete()
      return response.noContent()
    } else return response.notFound()
  }

  /**
   * Enroll users in a team.
   * enroll teams/enroll/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async enroll({ params, request, response }) {
    const { id } = params
    const data = request.collect(['group_id', 'users_id'])

    const rules = {
      id: 'required|integer',
      group_id: 'required|integer',
      users_id: 'required|array',
    }

    const validation = validate({ ...params, ...request.all() }, rules)

    if (validation.fails()) return response.unprocessableEntity()

    const team = await Team.find(id)

    if (team) {
      await UserRole.createMany(
        data.map(d => {
          return {
            group_id: d.group_id,
            user_id: d.users_id,
            team_id: team.id,
          }
        })
      )
      return response.json(team.toJSON())
    } else return response.notFound()
  }
}

module.exports = TeamController
