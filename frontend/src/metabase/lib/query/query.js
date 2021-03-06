/* @flow */

import type {
    StructuredQuery as SQ,
    Aggregation, AggregationClause,
    Breakout, BreakoutClause,
    Filter, FilterClause,
    LimitClause,
    OrderBy, OrderByClause
} from "metabase/meta/types/Query";

import * as A from "./aggregation";
import * as B from "./breakout";
import * as F from "./filter";
import * as L from "./limit";
import * as O from "./order_by";

import Query from "metabase/lib/query";
import _ from "underscore";

// AGGREGATION

export const getAggregations     = (query: SQ)                                          => A.getAggregations(query.aggregation);
export const addAggregation      = (query: SQ, aggregation: Aggregation)                => setAggregationClause(query, A.addAggregation(query.aggregation, aggregation));
export const updateAggregation   = (query: SQ, index: number, aggregation: Aggregation) => setAggregationClause(query, A.updateAggregation(query.aggregation, index, aggregation));
export const removeAggregation   = (query: SQ, index: number)                           => setAggregationClause(query, A.removeAggregation(query.aggregation, index));
export const clearAggregations   = (query: SQ)                                          => setAggregationClause(query, A.clearAggregations(query.aggregation));

export const isBareRows          = (query: SQ) => A.isBareRows(query.aggregation);
export const hasEmptyAggregation = (query: SQ) => A.hasEmptyAggregation(query.aggregation);
export const hasValidAggregation = (query: SQ) => A.hasValidAggregation(query.aggregation);

// BREAKOUT

export const getBreakouts   = (query: SQ)                                    => B.getBreakouts(query.breakout);
export const addBreakout    = (query: SQ, breakout: Breakout)                => setBreakoutClause(query, B.addBreakout(query.breakout, breakout));
export const updateBreakout = (query: SQ, index: number, breakout: Breakout) => setBreakoutClause(query, B.updateBreakout(query.breakout, index, breakout));
export const removeBreakout = (query: SQ, index: number)                     => setBreakoutClause(query, B.removeBreakout(query.breakout, index));
export const clearBreakouts = (query: SQ)                                    => setBreakoutClause(query, B.clearBreakouts(query.breakout));

// FILTER

export const getFilters   = (query: SQ)                                 => F.getFilters(query.filter);
export const addFilter    = (query: SQ, filter: Filter)                 => setFilterClause(query, F.addFilter(query.filter, filter));
export const updateFilter = (query: SQ, index: number, filter: Filter)  => setFilterClause(query, F.updateFilter(query.filter, index, filter));
export const removeFilter = (query: SQ, index: number)                  => setFilterClause(query, F.removeFilter(query.filter, index));
export const clearFilters = (query: SQ)                                 => setFilterClause(query, F.clearFilters(query.filter));

export const canAddFilter = (query: SQ) => F.canAddFilter(query.filter);

// ORDER_BY

export const getOrderBys   = (query: SQ)                                   => O.getOrderBys(query.order_by);
export const addOrderBy    = (query: SQ, order_by: OrderBy)                => setOrderByClause(query, O.addOrderBy(query.order_by, order_by));
export const updateOrderBy = (query: SQ, index: number, order_by: OrderBy) => setOrderByClause(query, O.updateOrderBy(query.order_by, index, order_by));
export const removeOrderBy = (query: SQ, index: number)                    => setOrderByClause(query, O.removeOrderBy(query.order_by, index));
export const clearOrderBy  = (query: SQ)                                   => setOrderByClause(query, O.clearOrderBy(query.order_by));

// LIMIT

export const updateLimit = (query: SQ, limit: LimitClause) => setLimitClause(query, L.updateLimit(query.limit, limit));
export const clearLimit = (query: SQ) => setLimitClause(query, L.clearLimit(query.limit));

// we can enforce various constraints in these functions:

function setAggregationClause(query: SQ, aggregationClause: ?AggregationClause): SQ {
    let wasBareRows = A.isBareRows(query.aggregation);
    let isBareRows = A.isBareRows(aggregationClause);
    // when switching to or from bare rows clear out any sorting clauses
    if (isBareRows !== wasBareRows) {
        clearOrderBy(query);
    }
    // for bare rows we always clear out any dimensions because they don't make sense
    if (isBareRows) {
        clearBreakouts(query);
    }
    return setClause("aggregation", query, aggregationClause);
}
function setBreakoutClause(query: SQ, breakoutClause: ?BreakoutClause): SQ {
    let breakoutIds = B.getBreakouts(breakoutClause).filter(id => id != null);
    for (const [index, sort] of getOrderBys(query).entries()) {
        let sortId = Query.getFieldTargetId(sort[0]);
        if (sortId != null && !_.contains(breakoutIds, sortId)) {
            query = removeOrderBy(query, index);
        }
    }
    return setClause("breakout", query, breakoutClause);
}
function setFilterClause(query: SQ, filterClause: ?FilterClause): SQ {
    return setClause("filter", query, filterClause);
}
function setOrderByClause(query: SQ, orderByClause: ?OrderByClause): SQ {
    return setClause("order_by", query, orderByClause);
}
function setLimitClause(query: SQ, limitClause: ?LimitClause): SQ {
    return setClause("limit", query, limitClause);
}

// TODO: remove mutation
type FilterClauseName = "filter"|"aggregation"|"breakout"|"order_by"|"limit";
function setClause(clauseName: FilterClauseName, query: SQ, clause: ?any): SQ {
    if (clause == null) {
        delete query[clauseName];
    } else {
        query[clauseName] = clause
    }
    return query;
}
