<script>
  import { teams, selectTeam } from '../lib/team.js'

  const byLeague = new Map()
  for (const { league, team } of teams()) {
    if (!byLeague.has(league.slug)) byLeague.set(league.slug, { league, list: [] })
    byLeague.get(league.slug).list.push(team)
  }
</script>

<div class="view picker">
  <h1 class="screen-title">PICK YOUR TEAM</h1>
  {#each [...byLeague.values()] as group}
    <div class="picker-league">{group.league.name}</div>
    {#each group.list as team}
      <button class="picker-team" onclick={() => selectTeam(group.league.slug, team.slug)}>
        {team.name}
      </button>
    {/each}
  {/each}
</div>
