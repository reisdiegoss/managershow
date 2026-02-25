import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class ShowCheckin extends Model {
    static table = 'show_checkins'

    @field('show_id') showId!: string
    @field('user_id') userId!: string
    @field('checked_in_at') checkedInAt!: number
    @field('dynamic_data') dynamicData!: string // JSON store

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
